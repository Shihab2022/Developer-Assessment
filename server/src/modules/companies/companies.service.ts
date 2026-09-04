import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { slugify } from "../../helpers/utils";
import { writeAuditLog } from "../../lib/audit";
import { CompanyMemberRole } from "../../../generated/prisma/enums";

export const getMembership = async (userId: string, companyId: string) => {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  });
};

const assertCompanyAccess = async (
  user: IAuthUser,
  companyId: string,
  allowRoles: CompanyMemberRole[] = [
    CompanyMemberRole.OWNER,
    CompanyMemberRole.ADMIN,
    CompanyMemberRole.MEMBER,
  ],
) => {
  if (user.role === "ADMIN") return;
  const membership = await getMembership(user.id, companyId);
  if (!membership) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this company");
  }
  if (!allowRoles.includes(membership.role)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have the required permission for this company",
    );
  }
};

const create = async (
  payload: {
    name: string;
    logo?: string;
    description?: string;
    website?: string;
    industry?: string;
    location?: string;
    size?: string;
  },
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  const slug = slugify(payload.name);
  if (!slug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Company name is invalid");
  }
  let uniqueSlug = slug;
  let counter = 1;
  for (;;) {
    const exists = await prisma.company.findUnique({
      where: { slug: uniqueSlug },
    });
    if (!exists) break;
    uniqueSlug = `${slug}-${counter++}`;
  }

  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: payload.name,
        slug: uniqueSlug,
        logo: payload.logo,
        description: payload.description,
        website: payload.website,
        industry: payload.industry,
        location: payload.location,
        size: payload.size,
      },
    });
    await tx.companyMember.create({
      data: {
        companyId: created.id,
        userId: user.id,
        role: CompanyMemberRole.OWNER,
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { companyId: created.id },
    });
    return created;
  });

  await writeAuditLog({
    actorId: user.id,
    action: "company.create",
    entityType: "Company",
    entityId: company.id,
    newValue: { name: company.name },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return company;
};
const getById = async (id: string, user: IAuthUser) => {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true },
        where: { status: { not: "DELETED" } },
      },
      members: {
        select: { userId: true, role: true },
      },
    },
  });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
  await assertCompanyAccess(user, company.id);
  return company;
};

const update = async (
  id: string,
  payload: Record<string, unknown>,
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
  });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  await assertCompanyAccess(user, id, [
    CompanyMemberRole.OWNER,
    CompanyMemberRole.ADMIN,
  ]);

  const data: Record<string, unknown> = {};
  for (const key of [
    "logo",
    "description",
    "website",
    "industry",
    "location",
    "size",
  ]) {
    if (payload[key] !== undefined) data[key] = payload[key];
  }
  if (payload.name !== undefined) {
    data.name = payload.name;
    if (company.name !== payload.name) {
      const newSlug = slugify(payload.name as string);
      let uniqueSlug = newSlug;
      let counter = 1;
      for (;;) {
        const exists = await prisma.company.findUnique({
          where: { slug: uniqueSlug },
        });
        if (!exists || exists.id === id) break;
        uniqueSlug = `${newSlug}-${counter++}`;
      }
      data.slug = uniqueSlug;
    }
  }

  const updated = await prisma.company.update({
    where: { id },
    data,
  });

  await writeAuditLog({
    actorId: user.id,
    action: "company.update",
    entityType: "Company",
    entityId: id,
    previousValue: { name: company.name },
    newValue: data,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const remove = async (
  id: string,
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  const company = await prisma.company.findFirst({
    where: { id, deletedAt: null },
  });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  await assertCompanyAccess(user, id, [CompanyMemberRole.OWNER]);

  const updated = await prisma.company.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "company.delete",
    entityType: "Company",
    entityId: id,
    previousValue: { name: company.name },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const getMembers = async (id: string, user: IAuthUser) => {
  await assertCompanyAccess(user, id);
  const members = await prisma.companyMember.findMany({
    where: { companyId: id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          jobTitle: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return members;
};

const listCandidates = async (
  user: IAuthUser,
  companyId: string,
  query: { page?: number; limit?: number; status?: string; assessmentId?: string },
) => {
  if (user.role === "RECRUITER" && user.companyId !== companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this company");
  }
  const company = await prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  const where: Record<string, unknown> = { companyId };
  if (query.status) where.recruitmentStatus = query.status;
  if (query.assessmentId) where.assessmentId = query.assessmentId;

  const [total, invitations] = await Promise.all([
    prisma.invitation.count({ where }),
    prisma.invitation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: { select: { id: true, name: true, email: true, jobTitle: true } },
        assessment: { select: { id: true, title: true, status: true } },
      },
    }),
  ]);

  const candidateIds = invitations.map((i) => i.candidateId).filter((id): id is string => id !== null);
  const results = candidateIds.length
    ? await prisma.result.findMany({
        where: { assessmentId: where.assessmentId ?? undefined, candidateId: { in: candidateIds } },
        select: { id: true, candidateId: true, percentage: true, passed: true, timeTakenSeconds: true },
      })
    : [];
  const resultByCandidate = new Map(results.map((r) => [r.candidateId, r]));

  return {
    data: invitations.map((invitation) => ({
      invitationId: invitation.id,
      candidateId: invitation.candidateId,
      candidate: invitation.candidate,
      email: invitation.email,
      assessment: invitation.assessment,
      recruitmentStatus: invitation.recruitmentStatus,
      invitationStatus: invitation.status,
      invitedAt: invitation.invitedAt,
      result: invitation.candidateId ? resultByCandidate.get(invitation.candidateId) ?? null : null,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const updateCandidateStatus = async (
  user: IAuthUser,
  invitationId: string,
  recruitmentStatus: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, "Candidate invitation not found");

  if (user.role === "RECRUITER" && invitation.companyId !== user.companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this candidate");
  }

  const previous = invitation.recruitmentStatus;
  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: { recruitmentStatus: recruitmentStatus as never },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      assessment: { select: { id: true, title: true } },
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "candidate.recruitmentStatusChange",
    entityType: "Invitation",
    entityId: invitationId,
    previousValue: { recruitmentStatus: previous },
    newValue: { recruitmentStatus },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const companyAnalytics = async (user: IAuthUser, companyId: string) => {
  if (user.role === "RECRUITER" && user.companyId !== companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this company");
  }
  const company = await prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  const [
    totalAssessments,
    totalInvitations,
    completedResults,
    passedResults,
    totalCandidates,
    attempts,
    payments,
    creditsRemaining,
  ] = await Promise.all([
    prisma.assessment.count({ where: { companyId, deletedAt: null } }),
    prisma.invitation.count({ where: { companyId } }),
    prisma.result.count({ where: { assessment: { companyId } } }),
    prisma.result.count({ where: { assessment: { companyId }, passed: true } }),
    prisma.result.findMany({ where: { assessment: { companyId } }, select: { candidateId: true } }),
    prisma.attempt.count({ where: { companyId } }),
    prisma.payment.aggregate({ where: { companyId, status: "PAID" }, _sum: { amount: true } }),
    prisma.company.findUnique({ where: { id: companyId }, select: { credits: true } }),
  ]);

  const uniqueCandidates = new Set(totalCandidates.map((c) => c.candidateId)).size;
  const averageScore = completedResults
    ? Math.round(
        (await prisma.result.aggregate({
          where: { assessment: { companyId } },
          _avg: { percentage: true },
        }))._avg.percentage ?? 0,
      )
    : 0;

  return {
    companyId,
    companyName: company.name,
    totalAssessments,
    totalInvitations,
    completedAssessments: completedResults,
    passRate: completedResults ? Math.round((passedResults / completedResults) * 100) : 0,
    averageScore,
    candidateCount: uniqueCandidates,
    totalAttempts: attempts,
    creditsConsumed: null,
    creditsRemaining: creditsRemaining?.credits ?? 0,
    paymentTotals: payments._sum.amount ?? 0,
  };
};

const list = async (q?: string, page = 1, limit = 10) => {
  const where = {
    deletedAt: null,
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        industry: true,
        location: true,
        size: true,
        createdAt: true,
      },
    }),
  ]);
  return {
    data: companies,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

export const CompanyServices = {
  create,
  getById,
  update,
  remove,
  getMembers,
  list,
  listCandidates,
  updateCandidateStatus,
  companyAnalytics,
  assertCompanyAccess,
};
