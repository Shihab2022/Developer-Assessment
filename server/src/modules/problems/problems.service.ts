import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser, PaginatedResult } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { ProblemStatus, ProblemType } from "../../../generated/prisma/enums";

type ProblemCreatePayload = {
  title: string;
  description: string;
  type: ProblemType;
  difficulty?: string;
  category?: string;
  points?: number;
  timeLimit?: number;
  memoryLimit?: number;
  tags?: string[];
  status?: string;
  expectedAnswer?: unknown;
  testCases?: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
    order: number;
  }[];
  options?: { text: string; isCorrect: boolean; order: number }[];
};

const assertProblemAccess = async (
  user: IAuthUser,
  problem: { id: string; createdBy: string; companyId: string | null },
) => {
  if (user.role === "ADMIN") return;
  if (problem.createdBy === user.id) return;
  if (
    user.role === "RECRUITER" &&
    problem.companyId &&
    problem.companyId === user.companyId
  ) {
    return;
  }
  throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this problem");
};

const create = async (
  payload: ProblemCreatePayload,
  user: IAuthUser,
  meta: { ip?: string; userAgent?: string },
) => {
  const companyId =
    user.role === "RECRUITER"
      ? (user.companyId ?? null)
      : user.role === "CANDIDATE"
        ? null
        : payload.category
          ? null
          : null; // admin may create without company

  const problem = await prisma.$transaction(async (tx) => {
    const created = await tx.problem.create({
      data: {
        title: payload.title,
        description: payload.description,
        type: payload.type,
        difficulty: payload.difficulty as never,
        category: payload.category,
        points: payload.points ?? 10,
        timeLimit: payload.timeLimit,
        memoryLimit: payload.memoryLimit,
        expectedAnswer: (payload.expectedAnswer as never) ?? undefined,
        createdBy: user.id,
        companyId,
        status: (payload.status ?? "DRAFT") as never,
        tags: payload.tags?.length
          ? { create: payload.tags.map((name) => ({ name })) }
          : undefined,
        testCases:
          payload.type === ProblemType.CODING
            ? {
                create: payload.testCases?.map((tc, index) => ({
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  isHidden: tc.isHidden,
                  order: tc.order ?? index,
                })),
              }
            : undefined,
        options:
          payload.type === ProblemType.MCQ
            ? {
                create: payload.options?.map((opt, index) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  order: opt.order ?? index,
                })),
              }
            : undefined,
      },
      include: {
        tags: true,
        testCases: true,
        options: true,
      },
    });
    return created;
  });

  await writeAuditLog({
    actorId: user.id,
    action: "problem.create",
    entityType: "Problem",
    entityId: problem.id,
    newValue: { title: problem.title, type: problem.type },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return problem;
};
const list = async (
  user: IAuthUser,
  query: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    q?: string;
    type?: string;
    difficulty?: string;
    category?: string;
    status?: string;
    tags?: string;
  },
): Promise<PaginatedResult<unknown>> => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: Record<string, unknown> = { deletedAt: null };
  if (query.type) where.type = query.type;
  if (query.difficulty) where.difficulty = query.difficulty;
  if (query.category) where.category = query.category;
  if (query.tags) {
    where.tags = { some: { name: { in: query.tags.split(",") } } };
  }
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { category: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (user.role === "CANDIDATE") {
    where.status = ProblemStatus.ACTIVE;
  } else if (user.role === "RECRUITER") {
    if (query.status) {
      where.status = query.status;
    } else {
      where.OR = [{ companyId: user.companyId ?? null }, { createdBy: user.id }];
    }
  } else {
    if (query.status) where.status = query.status;
  }

  const [total, data] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { [sortBy]: sortOrder } as never,
      select: {
        id: true,
        title: true,
        type: true,
        difficulty: true,
        category: true,
        points: true,
        status: true,
        companyId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { tags: true, testCases: true, options: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const sanitizeForCandidate = <
  T extends {
    expectedAnswer?: unknown;
    testCases?: Array<Record<string, unknown>>;
    options?: Array<Record<string, unknown>>;
  },
>(
  problem: T,
) => {
  const { expectedAnswer, testCases, options, ...rest } = problem;
  void expectedAnswer;
  const visibleTestCases = (testCases ?? [])
    .filter((tc) => tc.isHidden !== true)
    .map((tc) => {
      const { isHidden, ...visible } = tc;
      void isHidden;
      return visible;
    });
  const visibleOptions = (options ?? []).map((opt) => {
    const { isCorrect, ...visible } = opt;
    void isCorrect;
    return visible;
  });
  return {
    ...rest,
    ...(testCases !== undefined ? { testCases: visibleTestCases } : {}),
    ...(options !== undefined ? { options: visibleOptions } : {}),
  };
};

const getById = async (user: IAuthUser, id: string) => {
  const problem = await prisma.problem.findFirst({
    where: { id, deletedAt: null },
    include: {
      tags: true,
      testCases: { orderBy: { order: "asc" } },
      options: { orderBy: { order: "asc" } },
    },
  });
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");

  if (user.role === "CANDIDATE") {
    if (problem.status !== ProblemStatus.ACTIVE) {
      throw new ApiError(httpStatus.FORBIDDEN, "Problem is not available");
    }
    return sanitizeForCandidate(problem as unknown as Record<string, unknown>);
  }

  await assertProblemAccess(user, problem);
  return problem;
};
const update = async (
  user: IAuthUser,
  id: string,
  payload: Record<string, unknown>,
  meta: { ip?: string; userAgent?: string },
) => {
  const problem = await prisma.problem.findFirst({
    where: { id, deletedAt: null },
    include: { tags: true, testCases: true, options: true },
  });
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
  await assertProblemAccess(user, problem);

  const data: Record<string, unknown> = {};
  const scalarFields = [
    "title",
    "description",
    "type",
    "difficulty",
    "category",
    "points",
    "timeLimit",
    "memoryLimit",
    "status",
    "expectedAnswer",
  ];
  for (const field of scalarFields) {
    if (payload[field] !== undefined) data[field] = payload[field];
  }

  await prisma.$transaction(async (tx) => {
    if (payload.tags !== undefined) {
      await tx.problemTag.deleteMany({ where: { problemId: id } });
      const tags = payload.tags as string[];
      if (tags.length > 0) {
        await tx.problemTag.createMany({
          data: tags.map((name) => ({ problemId: id, name })),
        });
      }
    }
    if (payload.testCases !== undefined) {
      await tx.codingTestCase.deleteMany({ where: { problemId: id } });
      const testCases = payload.testCases as Array<{
        input: string;
        expectedOutput: string;
        isHidden: boolean;
        order: number;
      }>;
      if (testCases.length > 0) {
        await tx.codingTestCase.createMany({
          data: testCases.map((tc, index) => ({
            problemId: id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            order: tc.order ?? index,
          })),
        });
      }
    }
    if (payload.options !== undefined) {
      await tx.mCQOption.deleteMany({ where: { problemId: id } });
      const options = payload.options as Array<{
        text: string;
        isCorrect: boolean;
        order: number;
      }>;
      if (options.length > 0) {
        await tx.mCQOption.createMany({
          data: options.map((opt, index) => ({
            problemId: id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order ?? index,
          })),
        });
      }
    }
    await tx.problem.update({ where: { id }, data });
  });

  const updated = await prisma.problem.findFirst({
    where: { id },
    include: { tags: true, testCases: true, options: true },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "problem.update",
    entityType: "Problem",
    entityId: id,
    previousValue: { title: problem.title },
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
  const problem = await prisma.problem.findFirst({
    where: { id, deletedAt: null },
  });
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
  await assertProblemAccess(user, problem);

  const updated = await prisma.problem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "problem.delete",
    entityType: "Problem",
    entityId: id,
    previousValue: { title: problem.title },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const search = async (user: IAuthUser, q: string, page = 1, limit = 10) => {
  const where: Record<string, unknown> = {
    deletedAt: null,
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
    ],
  };
  if (user.role === "CANDIDATE") {
    where.status = ProblemStatus.ACTIVE;
  } else if (user.role === "RECRUITER") {
    where.OR = [
      ...(where.OR as unknown[]),
      { companyId: user.companyId ?? null },
      { createdBy: user.id },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        difficulty: true,
        category: true,
        points: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const ProblemServices = {
  create,
  list,
  getById,
  update,
  remove,
  search,
  sanitizeForCandidate,
};
