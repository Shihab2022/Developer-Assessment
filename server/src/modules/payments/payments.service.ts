import crypto from "crypto";
import httpStatus from "http-status";
import axios from "axios";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { PaymentStatus } from "../../../generated/prisma/enums";
import config from "../../config";

const generateTransactionId = () =>
  `TX-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

/** Mock mode is used in tests, or when SSLCommerz credentials are not configured. */
const isMockMode = () =>
  config.node_env === "test" ||
  !config.sslcommerz.store_id ||
  !config.sslcommerz.store_password;

const initiate = async (
  user: IAuthUser,
  payload: { packageId: string; companyId?: string },
  meta: { ip?: string; userAgent?: string },
) => {
  const pkg = await prisma.paymentPackage.findFirst({
    where: { id: payload.packageId, isActive: true },
  });
  if (!pkg) throw new ApiError(httpStatus.NOT_FOUND, "Payment package not found");

  let companyId = payload.companyId ?? user.companyId ?? "";
  if (!companyId) {
    const membership = await prisma.companyMember.findFirst({
      where: { userId: user.id },
      select: { companyId: true },
    });
    companyId = membership?.companyId ?? "";
  }
  if (!companyId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "A company is required to purchase credits",
    );
  }

  const transactionId = generateTransactionId();

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      companyId,
      packageId: pkg.id,
      transactionId,
      amount: pkg.price,
      currency: "BDT",
      status: PaymentStatus.PENDING,
      gateway: "SSLCOMMERZ",
    },
  });

  // Build SSLCommerz gateway payload.
  const gatewayPayload = {
    store_id: config.sslcommerz.store_id,
    store_passwd: config.sslcommerz.store_password,
    total_amount: pkg.price,
    currency: "BDT",
    tran_id: transactionId,
    success_url: `${config.app_url}/api/v1/payments/success`,
    fail_url: `${config.app_url}/api/v1/payments/fail`,
    cancel_url: `${config.app_url}/api/v1/payments/cancel`,
    ipn_url: `${config.app_url}/api/v1/payments/ipn`,
    cus_name: user.name,
    cus_email: user.email,
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    cus_phone: "01700000000",
    shipping_method: "NO",
    product_name: pkg.name,
    product_category: "Assessment Credits",
    product_profile: "non-physical-goods",
    value_a: payment.id,
  };

  // In mock mode (tests or missing credentials), return a mock gateway URL.
  if (isMockMode()) {
    return {
      payment,
      gatewayUrl: `${config.app_url}/api/v1/payments/mock?transactionId=${transactionId}`,
      isMock: true,
    };
  }

  let gatewayUrl: string;
  try {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(gatewayPayload)) {
      form.append(key, String(value));
    }
    const response = await axios.post(config.sslcommerz.payment_api, form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    });
    const data = response.data as {
      status?: string;
      GatewayPageURL?: string;
      failedreason?: string;
    };
    if (data.status !== "SUCCESS" || !data.GatewayPageURL) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          metadata: { gatewayError: data.failedreason ?? "Unknown error" },
        },
      });
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        `SSLCommerz gateway error: ${data.failedreason ?? "Unknown"}`,
      );
    }
    gatewayUrl = data.GatewayPageURL;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "Could not reach the payment gateway. Please try again.",
    );
  }

  await writeAuditLog({
    actorId: user.id,
    action: "payment.initiate",
    entityType: "Payment",
    entityId: payment.id,
    newValue: { transactionId, amount: pkg.price },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return { payment, gatewayUrl };
}; // ------------------- Gateway callbacks (idempotent) -------------------

/**
 * Verifies a transaction with the SSLCommerz validation API.
 * NEVER trust the frontend/success-URL visit alone.
 */
const verifyWithGateway = async (transactionId: string) => {
  if (isMockMode()) {
    // Mock mode: treat any non-cancelled transaction as validated.
    return { status: "VALID", verified: true };
  }
  try {
    const form = new URLSearchParams();
    form.append("store_id", config.sslcommerz.store_id);
    form.append("store_passwd", config.sslcommerz.store_password);
    form.append("tran_id", transactionId);
    const response = await axios.post(config.sslcommerz.validation_api, form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    });
    const data = response.data as { status?: string; risk_level?: string };
    return { status: data.status, verified: data.status === "VALID" };
  } catch {
    return { status: "UNKNOWN", verified: false };
  }
};

/**
 * Marks a payment as paid and credits the company. Idempotent: if the payment
 * is already PAID it returns early. Uses a transaction for atomicity.
 */
const markPaid = async (transactionId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
  });
  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");

  if (payment.status === PaymentStatus.PAID) {
    return { payment, credited: false }; // idempotent
  }
  if (
    payment.status === PaymentStatus.FAILED ||
    payment.status === PaymentStatus.CANCELLED
  ) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Payment is already ${payment.status.toLowerCase()}`,
    );
  }

  return prisma.$transaction(async (tx) => {
    // Optimistic concurrency guard: only advance from PENDING.
    const locked = await tx.payment.findUnique({ where: { transactionId } });
    if (!locked || locked.status !== PaymentStatus.PENDING) {
      return { payment: locked, credited: false };
    }

    const updated = await tx.payment.update({
      where: { transactionId },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    if (locked.companyId) {
      const pkg = locked.packageId
        ? await tx.paymentPackage.findUnique({ where: { id: locked.packageId } })
        : null;
      const credits = pkg?.credits ?? 0;
      if (credits > 0) {
        await tx.company.update({
          where: { id: locked.companyId },
          data: { credits: { increment: credits } },
        });
        await tx.creditTransaction.create({
          data: {
            companyId: locked.companyId,
            paymentId: locked.id,
            credits,
            type: "CREDIT",
            description: `Credits purchased via ${pkg?.name ?? "package"}`,
          },
        });
      }
    }
    return { payment: updated, credited: true };
  });
};
const handleSuccess = async (query: Record<string, unknown>) => {
  const transactionId = (query.tran_id ?? query.transactionId) as string;
  if (!transactionId)
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing transaction id");
  // Verify with gateway before marking paid.
  const verification = await verifyWithGateway(transactionId);
  if (!verification.verified) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Payment verification failed");
  }
  return markPaid(transactionId);
};

const handleFail = async (query: Record<string, unknown>) => {
  const transactionId = (query.tran_id ?? query.transactionId) as string;
  if (!transactionId)
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing transaction id");
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  if (payment.status === PaymentStatus.PENDING) {
    return prisma.payment.update({
      where: { transactionId },
      data: { status: PaymentStatus.FAILED },
    });
  }
  return payment;
};

const handleCancel = async (query: Record<string, unknown>) => {
  const transactionId = (query.tran_id ?? query.transactionId) as string;
  if (!transactionId)
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing transaction id");
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  if (payment.status === PaymentStatus.PENDING) {
    return prisma.payment.update({
      where: { transactionId },
      data: { status: PaymentStatus.CANCELLED },
    });
  }
  return payment;
};

const handleIpn = async (body: Record<string, unknown>) => {
  // IPN comes from the gateway — verify before trusting.
  const transactionId = (body.tran_id ?? body.transactionId) as string;
  if (!transactionId)
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing transaction id");
  const verification = await verifyWithGateway(transactionId);
  if (!verification.verified) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "Payment verification failed");
  }
  const result = await markPaid(transactionId);

  const payment = result.payment;
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      metadata: {
        ...((payment.metadata as Record<string, unknown>) ?? {}),
        ...body,
      } as never,
    },
  });
  return payment;
};
const getById = async (user: IAuthUser, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      package: { select: { id: true, name: true, credits: true } },
      company: { select: { id: true, name: true } },
    },
  });
  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  if (user.role === "ADMIN") return payment;
  if (payment.userId !== user.id && payment.companyId !== user.companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this payment");
  }
  return payment;
};

const list = async (
  user: IAuthUser,
  query: { page?: number; limit?: number; status?: string },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = {};
  if (user.role === "RECRUITER") {
    where.companyId = user.companyId ?? null;
  } else if (user.role === "CANDIDATE") {
    where.userId = user.id;
  }
  if (query.status) where.status = query.status;

  const [total, data] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        package: { select: { id: true, name: true, credits: true } },
        company: { select: { id: true, name: true } },
      },
    }),
  ]);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const listPackages = async () => {
  return prisma.paymentPackage.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
};

export const PaymentServices = {
  initiate,
  handleSuccess,
  handleFail,
  handleCancel,
  handleIpn,
  getById,
  list,
  listPackages,
  markPaid,
};
