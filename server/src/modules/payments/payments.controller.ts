import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import config from "../../config";
import { AuthRequest } from "../../middlewares/auth";
import { PaymentServices } from "./payments.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const redirectToCredits = (res: Response, status: "success" | "failed" | "cancelled") => {
  const url = new URL("/recruiter/credits", config.frontend_url);
  url.searchParams.set("payment", status);
  return res.redirect(303, url.toString());
};

const initiate = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await PaymentServices.initiate(req.user!, req.body, getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Payment initiated successfully",
    data: result,
  });
});

const success = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  await PaymentServices.handleSuccess(payload as never);
  return redirectToCredits(res, "success");
});

const fail = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  await PaymentServices.handleFail(payload as never);
  return redirectToCredits(res, "failed");
});

const cancel = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  await PaymentServices.handleCancel(payload as never);
  return redirectToCredits(res, "cancelled");
});

const ipn = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  const result = await PaymentServices.handleIpn(payload as never);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "IPN processed successfully",
    data: result,
  });
});

const mock = catchAsync(async (req: Request, res: Response) => {
  const transactionId = String(req.query.transactionId ?? "");
  if (!transactionId) {
    return res.status(400).json({ success: false, message: "Missing transactionId" });
  }
  // Completing the payment also credits the company — the redirect is all the
  // buyer needs to see, so the payload itself is unused here.
  await PaymentServices.completeMockPayment(transactionId);
  const redirectTo = `${config.frontend_url}/recruiter/credits?payment=success`;
  return res.redirect(302, redirectTo);
});

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await PaymentServices.getById(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payment retrieved successfully",
    data: result,
  });
});

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await PaymentServices.list(req.user!, {
    page,
    limit,
    status: req.query.status as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const listPackages = catchAsync(async (_req: Request, res: Response) => {
  const result = await PaymentServices.listPackages();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Packages retrieved successfully",
    data: result,
  });
});

export const PaymentController = {
  initiate,
  mock,
  success,
  fail,
  cancel,
  ipn,
  getById,
  list,
  listPackages,
};
