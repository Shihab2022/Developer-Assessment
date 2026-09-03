import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";

const create = async (
  payload: {
    title: string;
    description?: string;
    durationMinutes: number;
    passingScore?: number;
    maxAttempts?: number;
    shuffleProblems?: boolean;
    shuffleOptions?: boolean;
    showResults?: boolean;
    antiCheatingEnabled?: boolean;
    resultStrategy?: string;
    accessLevel?: string;
    questionConfig?: unknown;
    skills?: string[];
    difficultyDistribution?: unknown;
    antiCheatingSettings?: unknown;
    companyId?: string;
    status?: string;
  },
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  let companyId: string | null = null;
  if (user.role === "RECRUITER") {
    companyId = user.companyId ?? null;
  } else if (payload.companyId) {
    companyId = payload.companyId;
  }

  if (companyId) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, deletedAt: null },
    });
    if (!company) {
      throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
    }
  }

  const template = await prisma.assessmentTemplate.create({
    data: {
      title: payload.title,
      description: payload.description,
      durationMinutes: payload.durationMinutes,
      passingScore: payload.passingScore ?? 0,
      maxAttempts: payload.maxAttempts ?? 1,
      shuffleProblems: payload.shuffleProblems ?? false,
      shuffleOptions: payload.shuffleOptions ?? false,
      showResults: payload.showResults ?? true,
      antiCheatingEnabled: payload.antiCheatingEnabled ?? true,
      resultStrategy: (payload.resultStrategy ?? "LATEST_SCORE") as never,
      accessLevel: (payload.accessLevel ?? "INVITATION_ONLY") as never,
      questionConfig: (payload.questionConfig as never) ?? undefined,
      skills: payload.skills ?? [],
      difficultyDistribution: (payload.difficultyDistribution as never) ?? undefined,
      antiCheatingSettings: (payload.antiCheatingSettings as never) ?? undefined,
      status: (payload.status ?? "DRAFT") as never,
      companyId,
      createdBy: user.id,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "assessmentTemplate.create",
    entityType: "AssessmentTemplate",
    entityId: template.id,
    newValue: { title: template.title },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return template;
};

const list = async (
  user: IAuthUser,
  query: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    companyId?: string;
  },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" as const } },
      { description: { contains: query.q, mode: "insensitive" as const } },
    ];
  }

  if (user.role === "RECRUITER") {
    where.companyId = user.companyId ?? null;
  } else if (query.companyId) {
    where.companyId = query.companyId;
  }

  const [total, data] = await Promise.all([
    prisma.assessmentTemplate.count({ where }),
    prisma.assessmentTemplate.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getById = async (user: IAuthUser, id: string) => {
  const template = await prisma.assessmentTemplate.findUnique({
    where: { id },
    include: {
      company: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });
  if (!template) throw new ApiError(httpStatus.NOT_FOUND, "Assessment template not found");
  if (user.role === "RECRUITER") {
    if (template.companyId && template.companyId !== user.companyId) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this template");
    }
  }
  return template;
};

const update = async (
  user: IAuthUser,
  id: string,
  payload: Record<string, unknown>,
  meta: { ip?: string; userAgent?: string },
) => {
  const template = await prisma.assessmentTemplate.findUnique({ where: { id } });
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assessment template not found");
  }
  if (user.role === "RECRUITER") {
    if (template.companyId && template.companyId !== user.companyId) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this template");
    }
  }
  const data: Record<string, unknown> = {};
  const fields = [
    "title", "description", "durationMinutes", "passingScore",
    "maxAttempts", "shuffleProblems", "shuffleOptions", "showResults",
    "antiCheatingEnabled", "accessLevel", "status",
  ];
  for (const field of fields) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }
  if (payload.resultStrategy !== undefined) data.resultStrategy = payload.resultStrategy;
  if (payload.questionConfig !== undefined) data.questionConfig = payload.questionConfig;
  if (payload.skills !== undefined) data.skills = payload.skills;
  if (payload.difficultyDistribution !== undefined) data.difficultyDistribution = payload.difficultyDistribution;
  if (payload.antiCheatingSettings !== undefined) data.antiCheatingSettings = payload.antiCheatingSettings;
  const updated = await prisma.assessmentTemplate.update({ where: { id }, data });
  await writeAuditLog({
    actorId: user.id, action: "assessmentTemplate.update",
    entityType: "AssessmentTemplate", entityId: id,
    newValue: data, ipAddress: meta.ip, userAgent: meta.userAgent,
  });
  return updated;
};

const remove = async (user: IAuthUser, id: string, meta: { ip?: string; userAgent?: string }) => {
  const template = await prisma.assessmentTemplate.findUnique({ where: { id } });
  if (!template) throw new ApiError(httpStatus.NOT_FOUND, "Assessment template not found");
  if (user.role === "RECRUITER") {
    if (template.companyId && template.companyId !== user.companyId) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this template");
    }
  }
  await prisma.assessmentTemplate.delete({ where: { id } });
  await writeAuditLog({
    actorId: user.id, action: "assessmentTemplate.delete",
    entityType: "AssessmentTemplate", entityId: id,
    ipAddress: meta.ip, userAgent: meta.userAgent,
  });
  return null;
};

const useTemplate = async (
  user: IAuthUser, templateId: string,
  payload: { title?: string; companyId?: string },
  meta: { ip?: string; userAgent?: string },
) => {
  const template = await prisma.assessmentTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new ApiError(httpStatus.NOT_FOUND, "Assessment template not found");
  if (user.role === "RECRUITER") {
    if (template.companyId && template.companyId !== user.companyId) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this template");
    }
  }
  let companyId: string | null = null;
  if (user.role === "RECRUITER") companyId = user.companyId ?? null;
  else if (payload.companyId) companyId = payload.companyId;
  else if (template.companyId) companyId = template.companyId;
  if (!companyId) throw new ApiError(httpStatus.BAD_REQUEST, "Company is required");
  const assessment = await prisma.assessment.create({
    data: {
      title: payload.title ?? template.title,
      description: template.description,
      durationMinutes: template.durationMinutes,
      passingScore: template.passingScore,
      maxAttempts: template.maxAttempts,
      shuffleProblems: template.shuffleProblems,
      shuffleOptions: template.shuffleOptions,
      showResults: template.showResults,
      antiCheatingEnabled: template.antiCheatingEnabled,
      resultStrategy: template.resultStrategy,
      accessLevel: template.accessLevel,
      questionConfig: (template.questionConfig as never) ?? undefined,
      templateId: template.id, status: "DRAFT",
      companyId, createdBy: user.id,
    },
  });
  await writeAuditLog({
    actorId: user.id, action: "assessmentTemplate.use",
    entityType: "Assessment", entityId: assessment.id,
    newValue: { templateId, title: assessment.title },
    ipAddress: meta.ip, userAgent: meta.userAgent,
  });
  return assessment;
};

export const AssessmentTemplateServices = {
  create, list, getById, update, remove, useTemplate,
};
