import crypto from "crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser, PaginatedResult } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { AssessmentStatus } from "../../../generated/prisma/enums";

const VALID_TRANSITIONS: Record<AssessmentStatus, AssessmentStatus[]> = {
  [AssessmentStatus.DRAFT]: [AssessmentStatus.PUBLISHED, AssessmentStatus.ARCHIVED],
  [AssessmentStatus.PUBLISHED]: [AssessmentStatus.ACTIVE, AssessmentStatus.CLOSED],
  [AssessmentStatus.ACTIVE]: [AssessmentStatus.CLOSED],
  [AssessmentStatus.CLOSED]: [AssessmentStatus.ARCHIVED],
  [AssessmentStatus.ARCHIVED]: [],
};

export const assertValidAssessmentTransition = (
  current: string,
  next: AssessmentStatus,
) => {
  const allowed = VALID_TRANSITIONS[current as AssessmentStatus] ?? [];
  if (!allowed.includes(next)) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Invalid assessment status transition from ${current} to ${next}`,
    );
  }
};

const assertAssessmentAccess = async (
  user: IAuthUser,
  assessment: { id: string; companyId: string; createdBy: string },
  requireEdit = false,
) => {
  if (user.role === "ADMIN") return;
  if (user.role !== "RECRUITER") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this assessment",
    );
  }
  if (assessment.companyId !== user.companyId && assessment.createdBy !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this assessment",
    );
  }
  if (requireEdit && assessment.createdBy !== user.id) {
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: assessment.companyId,
          userId: user.id,
        },
      },
    });
    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to modify this assessment",
      );
    }
  }
};
const create = async (
  payload: {
    title: string;
    description?: string;
    instructions?: string;
    durationMinutes: number;
    passingScore?: number;
    startDate?: string | null;
    endDate?: string | null;
    maxAttempts?: number;
    shuffleProblems?: boolean;
    shuffleOptions?: boolean;
    showResults?: boolean;
    antiCheatingEnabled?: boolean;
    showCandidateRanking?: boolean;
    resultStrategy?: string;
    accessLevel?: string;
    accessCode?: string;
    templateId?: string;
    companyId?: string;
  },
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  let companyId: string | null;
  if (user.role === "RECRUITER") {
    if (!user.companyId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You must belong to a company before creating assessments",
      );
    }
    companyId = user.companyId;
  } else if (payload.companyId) {
    companyId = payload.companyId;
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "companyId is required when creating an assessment as an admin",
    );
  }

  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, "Company not found");
  }

  const startDate = payload.startDate ? new Date(payload.startDate) : null;
  const endDate = payload.endDate ? new Date(payload.endDate) : null;
  if (startDate && endDate && endDate <= startDate) {
    throw new ApiError(httpStatus.BAD_REQUEST, "endDate must be after startDate");
  }

  const assessment = await prisma.assessment.create({
    data: {
      title: payload.title,
      description: payload.description,
      instructions: payload.instructions,
      durationMinutes: payload.durationMinutes,
      passingScore: payload.passingScore ?? 0,
      startDate,
      endDate,
      maxAttempts: payload.maxAttempts ?? 1,
      shuffleProblems: payload.shuffleProblems ?? false,
      showResults: payload.showResults ?? true,
      antiCheatingEnabled: payload.antiCheatingEnabled ?? true,
      showCandidateRanking: payload.showCandidateRanking ?? true,
      resultStrategy: (payload.resultStrategy ?? "LATEST_SCORE") as never,
      accessLevel: (payload.accessLevel ?? "INVITATION_ONLY") as never,
      accessCodeHash: payload.accessCode ? crypto.createHash("sha256").update(payload.accessCode).digest("hex") : null,
      shuffleOptions: payload.shuffleOptions ?? false,
      templateId: payload.templateId ?? null,
      status: AssessmentStatus.DRAFT,
      companyId,
      createdBy: user.id,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.create",
    entityType: "Assessment",
    entityId: assessment.id,
    newValue: { title: assessment.title },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return assessment;
};
const list = async (
  user: IAuthUser,
  query: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    q?: string;
    status?: string;
    companyId?: string;
  },
): Promise<PaginatedResult<unknown>> => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = { deletedAt: null };
  if (query.status) where.status = query.status;
  if (query.companyId) where.companyId = query.companyId;
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (user.role === "RECRUITER") {
    where.companyId = user.companyId ?? null;
  } else if (user.role === "CANDIDATE") {
    where.status = { in: ["PUBLISHED", "ACTIVE"] };
  }

  const [total, data] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { [sortBy]: sortOrder } as never,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        durationMinutes: true,
        passingScore: true,
        startDate: true,
        endDate: true,
        maxAttempts: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { problems: true, invitations: true, attempts: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getById = async (user: IAuthUser, id: string) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id, deletedAt: null },
    include: {
      problems: {
        orderBy: { order: "asc" },
        include: {
          problem: {
            include: {
              tags: true,
              testCases: { orderBy: { order: "asc" } },
              options: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");

  if (user.role === "CANDIDATE") {
    if (assessment.status === "DRAFT" || assessment.status === "ARCHIVED") {
      throw new ApiError(httpStatus.FORBIDDEN, "Assessment is not available");
    }
    // Candidates must not receive hidden test cases / correct answers.
    return {
      ...assessment,
      problems: assessment.problems.map((ap) => ({
        ...ap,
        problem: {
          ...ap.problem,
          expectedAnswer: undefined,
          testCases: ap.problem.testCases
            .filter((tc) => !tc.isHidden)
            .map(({ isHidden, ...rest }) => {
              void isHidden;
              return rest;
            }),
          options: ap.problem.options.map(({ isCorrect, ...rest }) => {
            void isCorrect;
            return rest;
          }),
        },
      })),
    };
  }

  await assertAssessmentAccess(user, assessment);
  return assessment;
};

const getHistory = async (user: IAuthUser, id: string) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, companyId: true, createdBy: true },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment);

  const attempts = await prisma.attempt.findMany({
    where: { assessmentId: id },
    include: {
      candidate: {
        select: { id: true, name: true, email: true },
      },
      result: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return attempts;
};
const update = async (
  user: IAuthUser,
  id: string,
  payload: Record<string, unknown>,
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment, true);

  const hasActiveAttempts = await prisma.attempt.count({
    where: {
      assessmentId: id,
      status: { in: ["IN_PROGRESS", "SUBMITTED", "EVALUATING", "COMPLETED"] },
    },
  });
  if (hasActiveAttempts > 0) {
    // Only allow safe modifications once candidates have active attempts.
    const allowed = [
      "description",
      "instructions",
      "showResults",
      "antiCheatingEnabled",
    ];
    const requested = Object.keys(payload);
    const unsafe = requested.filter((key) => !allowed.includes(key));
    if (unsafe.length > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Cannot modify [${unsafe.join(", ")}] because the assessment has active attempts`,
      );
    }
  }

  const data: Record<string, unknown> = {};
  const fields = [
    "title",
    "description",
    "instructions",
    "durationMinutes",
    "passingScore",
    "maxAttempts",
    "shuffleProblems",
    "showResults",
    "antiCheatingEnabled",
    "showCandidateRanking",
    "resultStrategy",
    "accessLevel",
    "shuffleOptions",
  ];
  for (const field of fields) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }
  if (payload.startDate !== undefined) {
    data.startDate = payload.startDate ? new Date(payload.startDate as string) : null;
  }
  if (payload.endDate !== undefined) {
    data.endDate = payload.endDate ? new Date(payload.endDate as string) : null;
  }
  if (payload.accessCode !== undefined) {
    const code = payload.accessCode as string | null;
    data.accessCodeHash = code ? crypto.createHash("sha256").update(code).digest("hex") : null;
  }

  const updated = await prisma.assessment.update({ where: { id }, data: data as never });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.update",
    entityType: "Assessment",
    entityId: id,
    previousValue: { title: assessment.title, status: assessment.status },
    newValue: data,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const remove = async (
  user: IAuthUser,
  id: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment, true);

  const updated = await prisma.assessment.update({
    where: { id },
    data: { deletedAt: new Date(), status: AssessmentStatus.ARCHIVED },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.delete",
    entityType: "Assessment",
    entityId: id,
    previousValue: { title: assessment.title },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const publish = async (
  user: IAuthUser,
  id: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment, true);

  assertValidAssessmentTransition(assessment.status, AssessmentStatus.PUBLISHED);

  if (user.role === "RECRUITER") {
    const company = await prisma.company.findUnique({
      where: { id: assessment.companyId },
    });
    if (!company || company.credits < 1) {
      throw new ApiError(
        httpStatus.PAYMENT_REQUIRED,
        "Insufficient assessment credits. Please purchase a package first.",
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    if (user.role === "RECRUITER") {
      await tx.company.update({
        where: { id: assessment.companyId },
        data: { credits: { decrement: 1 } },
      });
      await tx.creditTransaction.create({
        data: {
          companyId: assessment.companyId,
          credits: 1,
          type: "DEBIT",
          description: `Assessment published: ${assessment.title}`,
        },
      });
    }
    return tx.assessment.update({
      where: { id },
      data: { status: AssessmentStatus.PUBLISHED },
    });
  });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.publish",
    entityType: "Assessment",
    entityId: id,
    previousValue: { status: assessment.status },
    newValue: { status: AssessmentStatus.PUBLISHED },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return result;
};

const close = async (
  user: IAuthUser,
  id: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment, true);

  assertValidAssessmentTransition(assessment.status, AssessmentStatus.CLOSED);

  const updated = await prisma.assessment.update({
    where: { id },
    data: { status: AssessmentStatus.CLOSED },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.close",
    entityType: "Assessment",
    entityId: id,
    previousValue: { status: assessment.status },
    newValue: { status: AssessmentStatus.CLOSED },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};
const addProblem = async (
  user: IAuthUser,
  assessmentId: string,
  payload: {
    problemId: string;
    points?: number;
    isRequired?: boolean;
    section?: string;
    order?: number;
  },
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment, true);

  if (assessment.status !== "DRAFT") {
    const activeAttempts = await prisma.attempt.count({
      where: {
        assessmentId,
        status: { in: ["IN_PROGRESS", "SUBMITTED", "EVALUATING", "COMPLETED"] },
      },
    });
    if (activeAttempts > 0) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Cannot modify assessment problems while attempts are active",
      );
    }
  }

  const problem = await prisma.problem.findFirst({
    where: { id: payload.problemId, deletedAt: null },
  });
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");

  if (user.role === "RECRUITER") {
    if (problem.companyId && problem.companyId !== assessment.companyId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Problem does not belong to your company",
      );
    }
  }

  const existing = await prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId: payload.problemId } },
  });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Problem is already in this assessment");
  }

  const maxOrder = await prisma.assessmentProblem.aggregate({
    where: { assessmentId },
    _max: { order: true },
  });

  const created = await prisma.assessmentProblem.create({
    data: {
      assessmentId,
      problemId: payload.problemId,
      points: payload.points ?? problem.points,
      isRequired: payload.isRequired ?? true,
      section: payload.section,
      order: payload.order ?? (maxOrder._max.order ?? -1) + 1,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.addProblem",
    entityType: "AssessmentProblem",
    entityId: created.id,
    newValue: { problemId: payload.problemId, assessmentId },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return created;
};

const listProblems = async (user: IAuthUser, assessmentId: string) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");

  const includeFull = user.role !== "CANDIDATE";

  const problems = await prisma.assessmentProblem.findMany({
    where: { assessmentId },
    orderBy: { order: "asc" },
    include: {
      problem: includeFull
        ? {
            include: {
              tags: true,
              testCases: { orderBy: { order: "asc" } },
              options: { orderBy: { order: "asc" } },
            },
          }
        : {
            include: {
              tags: true,
              testCases: {
                where: { isHidden: false },
                orderBy: { order: "asc" },
                select: { id: true, input: true, expectedOutput: true, order: true },
              },
              options: {
                orderBy: { order: "asc" },
                select: { id: true, text: true, order: true },
              },
            },
          },
    },
  });

  if (user.role === "RECRUITER") {
    await assertAssessmentAccess(user, assessment);
  }

  return problems;
};

const updateProblem = async (
  user: IAuthUser,
  assessmentId: string,
  problemId: string,
  payload: { points?: number; isRequired?: boolean; section?: string; order?: number },
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment, true);

  const link = await prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId } },
  });
  if (!link)
    throw new ApiError(httpStatus.NOT_FOUND, "Problem is not part of this assessment");

  const updated = await prisma.assessmentProblem.update({
    where: { id: link.id },
    data: {
      points: payload.points,
      isRequired: payload.isRequired,
      section: payload.section,
      order: payload.order,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.updateProblem",
    entityType: "AssessmentProblem",
    entityId: link.id,
    newValue: payload,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const removeProblem = async (
  user: IAuthUser,
  assessmentId: string,
  problemId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await assertAssessmentAccess(user, assessment, true);

  const link = await prisma.assessmentProblem.findUnique({
    where: { assessmentId_problemId: { assessmentId, problemId } },
  });
  if (!link)
    throw new ApiError(httpStatus.NOT_FOUND, "Problem is not part of this assessment");

  await prisma.assessmentProblem.delete({ where: { id: link.id } });

  await writeAuditLog({
    actorId: user.id,
    action: "assessment.removeProblem",
    entityType: "AssessmentProblem",
    entityId: link.id,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return null;
};

export const AssessmentServices = {
  create,
  list,
  getById,
  getHistory,
  update,
  remove,
  publish,
  close,
  addProblem,
  listProblems,
  updateProblem,
  removeProblem,
  assertAssessmentAccess,
};
