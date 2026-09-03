import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { UserRole, UserStatus } from "../../../generated/prisma/enums";

const listUsers = async (
  query: {
    page?: number;
    limit?: number;
    q?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  },
  includeDeleted = false,
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = {};
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (!includeDeleted) {
    where.deletedAt = null;
  }

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder } as never,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
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
      profileImageUrl: true,
      resumeUrl: true,
      jobTitle: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  return user;
};

const updateUserStatus = async (
  adminUser: IAuthUser,
  id: string,
  status: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (user.id === adminUser.id) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot change your own status",
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: status as UserStatus },
  });

  await writeAuditLog({
    actorId: adminUser.id,
    action: "user.statusChange",
    entityType: "User",
    entityId: id,
    previousValue: { status: user.status },
    newValue: { status },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const updateUserRole = async (
  adminUser: IAuthUser,
  id: string,
  role: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  if (user.id === adminUser.id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot change your own role");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: role as UserRole },
  });

  await writeAuditLog({
    actorId: adminUser.id,
    action: "user.roleChange",
    entityType: "User",
    entityId: id,
    previousValue: { role: user.role },
    newValue: { role },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};const listCompanies = async (
  query: { page?: number; limit?: number; q?: string },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = {};
  if (query.q) {
    where.name = { contains: query.q, mode: "insensitive" };
  }

  const [total, data] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true, assessments: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const listAssessments = async (
  query: { page?: number; limit?: number; q?: string; status?: string },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.q) {
    where.title = { contains: query.q, mode: "insensitive" };
  }

  const [total, data] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { attempts: true, problems: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const listPayments = async (
  query: { page?: number; limit?: number; status?: string },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;

  const [total, data] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        package: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};const dashboardStats = async () => {
  const [
    totalUsers,
    candidates,
    recruiters,
    companies,
    assessments,
    completedAttempts,
    payments,
    revenue,
    activeUsers,
    suspendedUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { status: { not: "DELETED" } } }),
    prisma.user.count({ where: { role: "CANDIDATE", status: { not: "DELETED" } } }),
    prisma.user.count({ where: { role: "RECRUITER", status: { not: "DELETED" } } }),
    prisma.company.count({ where: { deletedAt: null } }),
    prisma.assessment.count({ where: { deletedAt: null } }),
    prisma.attempt.count({
      where: { status: { in: ["COMPLETED", "SUBMITTED", "AUTO_SUBMITTED"] } },
    }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.user.count({
      where: {
        status: "ACTIVE",
        updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
  ]);

  return {
    totalUsers,
    candidates,
    recruiters,
    companies,
    assessments,
    completedAttempts,
    payments,
    revenue: revenue._sum.amount ?? 0,
    activeUsers,
    suspendedUsers,
  };
};

const listAuditLogs = async (
  query: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    actorId?: string;
  },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const where: Record<string, unknown> = {};
  if (query.action) where.action = { contains: query.action };
  if (query.entityType) where.entityType = query.entityType;
  if (query.actorId) where.actorId = query.actorId;

  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const listProblems = async (
  query: { page?: number; limit?: number; q?: string; type?: string },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = {};
  if (query.type) where.type = query.type;
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        difficulty: true,
        status: true,
        points: true,
        createdAt: true,
        creator: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const AdminServices = {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  listCompanies,
  listAssessments,
  listPayments,
  dashboardStats,
  listAuditLogs,
  listProblems,
};