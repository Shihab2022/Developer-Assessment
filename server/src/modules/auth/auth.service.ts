import crypto from "crypto";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { generateJwtToken, verifyJwtToken } from "../../helpers/jwtHelpers";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { generateCompanyCode, slugify } from "../../helpers/utils";
import {
  buildVerificationEmail,
  isMailEnabled,
  sendMail,
} from "../../lib/mailer";
import {
  CompanyMemberRole,
  UserRole,
  UserStatus,
  VerificationTokenType,
} from "../../../generated/prisma/enums";

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const parseExpiryMs = (expiry: string): number => {
  const m = expiry.match(/^(\d+)([smhd])$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(m[1]) || 0;
  const unit = m[2] as string;
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[unit] ?? 0);
};

const mapRole = (role: string): UserRole => {
  if (role === UserRole.ADMIN) return UserRole.ADMIN;
  if (role === UserRole.COMPANY) return UserRole.COMPANY;
  if (role === UserRole.RECRUITER) return UserRole.RECRUITER;
  return UserRole.CANDIDATE;
};

const uniqueCompanyCode = async (name: string): Promise<string> => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateCompanyCode(name);
    const exists = await prisma.company.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return `COMPANY-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

const uniqueCompanySlug = async (name: string): Promise<string> => {
  const base = slugify(name) || "company";
  let candidate = base;
  let counter = 1;
  for (;;) {
    const exists = await prisma.company.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${base}-${counter++}`;
  }
};

/** Creates a single-use email-verification token and emails the confirm link. */
const issueEmailVerification = async (user: { id: string; name: string; email: string }) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + config.mail.verification_expires_hours * 60 * 60 * 1000,
  );
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      type: VerificationTokenType.EMAIL_VERIFICATION,
      expiresAt,
    },
  });
  const verifyUrl = `${config.frontend_url}/verify-email?token=${token}`;
  const rendered = buildVerificationEmail({
    name: user.name,
    verifyUrl,
    expiresInHours: config.mail.verification_expires_hours,
  });
  await sendMail({
    to: user.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
  return token;
};

const issueTokens = async (user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) => {
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = generateJwtToken(
    jwtPayload,
    config.jwt.access_secret,
    config.jwt.access_expires_in,
  );
  const refreshToken = generateJwtToken(
    jwtPayload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in,
  );

  const expiresInMs = parseExpiryMs(config.jwt.refresh_expires_in);
  const expiresAt = new Date(Date.now() + expiresInMs);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
};

const register = async (
  payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    companyId?: string;
    /** Friendly company name — used when a COMPANY owner self-registers. */
    companyName?: string;
    /** Friendly join code — used when a recruiter joins an existing company. */
    companyCode?: string;
  },
  meta: { ip?: string; userAgent?: string },
) => {
  const email = payload.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "An account with this email already exists",
    );
  }

  if (payload.role === UserRole.ADMIN && config.node_env !== "test") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Admin accounts cannot be self-registered",
    );
  }

  const role = mapRole(payload.role ?? "CANDIDATE");

  // Recruiters join an existing company either with the friendly code (preferred)
  // or, for backwards compatibility, with the raw company id.
  let companyId: string | null = null;
  if (role === UserRole.RECRUITER) {
    const code = payload.companyCode?.trim().toUpperCase();
    if (code) {
      const company = await prisma.company.findFirst({
        where: { code, deletedAt: null },
      });
      if (!company) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "That company code was not recognised. Check it with your company owner.",
        );
      }
      companyId = company.id;
    } else if (payload.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: payload.companyId, deletedAt: null },
      });
      if (!company) {
        throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
      }
      companyId = company.id;
    }
  }

  const hashedPassword = await bcrypt.hash(payload.password, config.bcrypt_salt_rounds);

  const mailEnabled = isMailEnabled();

  const { created, companyCode } = await prisma.$transaction(async (tx) => {
    let resolvedCompanyId = companyId;
    let resolvedCompanyCode: string | null = null;

    if (role === UserRole.COMPANY) {
      const companyName = (
        payload.companyName?.trim() || `${payload.name}'s Company`
      ).slice(0, 200);
      const code = await uniqueCompanyCode(companyName);
      const company = await tx.company.create({
        data: {
          name: companyName,
          slug: await uniqueCompanySlug(companyName),
          code,
        },
      });
      resolvedCompanyId = company.id;
      resolvedCompanyCode = code;
    }

    const user = await tx.user.create({
      data: {
        name: payload.name,
        email,
        password: hashedPassword,
        role,
        phone: payload.phone,
        companyId: resolvedCompanyId,
        // Without SMTP configured the address is auto-verified so the app stays usable.
        emailVerified: !mailEnabled,
        emailVerifiedAt: mailEnabled ? null : new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        companyId: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (resolvedCompanyId && (role === UserRole.COMPANY || role === UserRole.RECRUITER)) {
      await tx.companyMember.create({
        data: {
          companyId: resolvedCompanyId,
          userId: user.id,
          role: role === UserRole.COMPANY ? CompanyMemberRole.OWNER : CompanyMemberRole.MEMBER,
        },
      });
    }

    return { created: user, companyCode: resolvedCompanyCode };
  });

  await writeAuditLog({
    actorId: created.id,
    action: "user.register",
    entityType: "User",
    entityId: created.id,
    newValue: { email: created.email, role: created.role },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  if (!mailEnabled) {
    // No-SMTP / development mode: verify immediately and hand back a session.
    const tokens = await issueTokens({
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
    });
    return {
      requiresVerification: false,
      user: created,
      companyCode,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  await issueEmailVerification(created);

  return {
    requiresVerification: true,
    user: created,
    companyCode,
  };
};

const login = async (
  payload: { email: string; password: string },
  meta: { ip?: string; userAgent?: string },
) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }
  if (user.status === UserStatus.SUSPENDED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account has been suspended. Contact support.",
    );
  }
  if (user.status === UserStatus.DELETED) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(payload.password, user.password);
  if (!passwordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  if (isMailEnabled() && !user.emailVerified) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
    );
  }

  const tokens = await issueTokens({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "user.login",
    entityType: "User",
    entityId: user.id,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
  };
};

const refreshToken = async (
  refreshTokenInput: string,
  meta: { ip?: string; userAgent?: string },
) => {
  try {
    verifyJwtToken(refreshTokenInput, config.jwt.refresh_secret);
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const tokenHash = hashToken(refreshTokenInput);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Refresh token has been revoked or is unknown",
    );
  }
  if (stored.revokedAt) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token has been revoked");
  }
  if (stored.expiresAt < new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token has expired");
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId as string },
  });
  if (!user || user.status === UserStatus.DELETED) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User no longer exists");
  }
  if (user.status === UserStatus.SUSPENDED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Account suspended");
  }

  // Refresh token rotation: atomically revoke the old token.
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({ where: { id: stored.id } }),
  ]);

  const tokens = await issueTokens({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "auth.refresh",
    entityType: "User",
    entityId: user.id,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const logout = async (
  refreshTokenInput: string,
  meta: { ip?: string; userAgent?: string },
) => {
  if (!refreshTokenInput) return;
  const tokenHash = hashToken(refreshTokenInput);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored) return;

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  await writeAuditLog({
    actorId: stored.userId,
    action: "user.logout",
    entityType: "User",
    entityId: stored.userId,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });
};

const getMe = async (user: IAuthUser) => {
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      bio: true,
      skills: true,
      experience: true,
      education: true,
      profileImageUrl: true,
      resumeUrl: true,
      jobTitle: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!profile) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return profile;
};

const verifyEmail = async (token: string) => {
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Verification token is required");
  }
  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.type !== VerificationTokenType.EMAIL_VERIFICATION) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or unknown verification link");
  }
  if (record.usedAt) {
    throw new ApiError(httpStatus.CONFLICT, "This verification link has already been used");
  }
  if (record.expiresAt < new Date()) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "This verification link has expired. Please request a new one.",
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
      select: { id: true, email: true, name: true, emailVerified: true, role: true },
    }),
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await writeAuditLog({
    actorId: updated.id,
    action: "user.emailVerified",
    entityType: "User",
    entityId: updated.id,
  });

  return updated;
};

const resendVerification = async (payload: { email: string }) => {
  const email = payload.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  // Never reveal whether an account exists.
  if (!user || user.emailVerified) return { sent: false };

  await prisma.verificationToken.updateMany({
    where: {
      userId: user.id,
      type: VerificationTokenType.EMAIL_VERIFICATION,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  if (isMailEnabled()) {
    await issueEmailVerification(user);
  }

  await writeAuditLog({
    actorId: user.id,
    action: "user.verificationResent",
    entityType: "User",
    entityId: user.id,
  });

  return { sent: isMailEnabled() };
};

export const AuthServices = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
};
