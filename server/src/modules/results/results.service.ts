import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";

const assertResultVisibleToCandidate = (
  result: { releasedAt: Date | null },
  assessment: { showResults: boolean },
) => {
  if (!assessment.showResults && result.releasedAt === null) {
    throw new ApiError(httpStatus.FORBIDDEN, "Results have not been released yet");
  }
};

const getById = async (user: IAuthUser, resultId: string) => {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      assessment: { select: { id: true, title: true, showResults: true } },
      items: {
        include: {
          problem: {
            select: { id: true, title: true, type: true, points: true },
          },
        },
      },
      attempt: {
        select: {
          id: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          expiresAt: true,
          score: true,
          maxScore: true,
        },
      },
    },
  });
  if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Result not found");

  if (user.role === "CANDIDATE") {
    if (result.candidateId !== user.id) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this result");
    }
    assertResultVisibleToCandidate(result, result.assessment);
  } else if (user.role === "RECRUITER") {
    const assessment = await prisma.assessment.findUnique({
      where: { id: result.assessmentId },
      select: { companyId: true, createdBy: true },
    });
    const hasAccess =
      assessment !== null &&
      (assessment.companyId === user.companyId || assessment.createdBy === user.id);
    if (!hasAccess) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this result");
    }
  }

  return result;
};

const candidatesMeResults = async (user: IAuthUser, page = 1, limit = 10) => {
  // Only show results that have been released to the candidate.
  const where = { candidateId: user.id, releasedAt: { not: null } };
  const [total, data] = await Promise.all([
    prisma.result.count({ where }),
    prisma.result.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: { id: true, title: true, showResults: true },
        },
        attempt: {
          select: { id: true, status: true, score: true, maxScore: true },
        },
      },
    }),
  ]);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const listForAssessment = async (
  user: IAuthUser,
  assessmentId: string,
  page = 1,
  limit = 10,
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");

  if (user.role === "RECRUITER") {
    const hasAccess =
      assessment.companyId === user.companyId || assessment.createdBy === user.id;
    if (!hasAccess) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have access to this assessment",
      );
    }
  } else if (user.role === "CANDIDATE") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Candidates cannot list assessment results",
    );
  }

  const where = { assessmentId };
  const [total, data] = await Promise.all([
    prisma.result.count({ where }),
    prisma.result.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { earnedPoints: "desc" },
      include: {
        candidate: {
          select: { id: true, name: true, email: true },
        },
        attempt: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            score: true,
            maxScore: true,
          },
        },
      },
    }),
  ]);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const ResultServices = {
  getById,
  candidatesMeResults,
  listForAssessment,
};
