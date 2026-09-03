import crypto from "crypto";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { generateJwtToken, verifyJwtToken } from "../../helpers/jwtHelpers";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { UserRole, UserStatus } from "../../../generated/prisma/enums";

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
  if (role === UserRole.RECRUITER) return UserRole.RECRUITER;
  return UserRole.CANDIDATE;
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
  },
  meta: { ip?: string; userAgent?: string },
) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "An account with this email already exists",
    );
  }

  if (payload.role === UserRole.RECRUITER) {
    if (payload.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: payload.companyId, deletedAt: null },
      });
      if (!company) {
        throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
      }
    }
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_rounds,
  );

  const role = mapRole(payload.role ?? "CANDIDATE");

  const created = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: hashedPassword,
      role,
      phone: payload.phone,
      companyId:
        payload.role === UserRole.RECRUITER && payload.companyId
          ? payload.companyId
          : null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      companyId: true,
      status: true,
      createdAt: true,
    },
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

  return created;
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
  let payload;
  try {
    payload = verifyJwtToken(refreshTokenInput, config.jwt.refresh_secret);
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

export const AuthServices = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};