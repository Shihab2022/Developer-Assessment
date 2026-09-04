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

const getSkillBreakdown = async (user: IAuthUser, resultId: string) => {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
    select: { id: true, candidateId: true, assessmentId: true, releasedAt: true, percentage: true, passed: true },
  });
  if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Result not found");

  if (user.role === "CANDIDATE") {
    if (result.candidateId !== user.id) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this result");
    }
    if (result.releasedAt === null) {
      throw new ApiError(httpStatus.FORBIDDEN, "Results have not been released yet");
    }
  } else if (user.role === "RECRUITER") {
    const assessment = await prisma.assessment.findUnique({
      where: { id: result.assessmentId },
      select: { companyId: true, createdBy: true },
    });
    const hasAccess =
      assessment !== null &&
      (assessment.companyId === user.companyId || assessment.createdBy === user.id);
    if (!hasAccess) throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this result");
  }

  const items = await prisma.resultItem.findMany({
    where: { resultId },
    include: {
      problem: { select: { id: true, skills: true, category: true } },
    },
  });

  const skillMap = new Map<string, { skill: string; totalPoints: number; earnedPoints: number; questions: number }>();
  for (const item of items) {
    const skills = item.problem.skills.length > 0 ? item.problem.skills : [item.problem.category ?? "Uncategorized"];
    for (const skill of skills) {
      const entry = skillMap.get(skill) ?? { skill, totalPoints: 0, earnedPoints: 0, questions: 0 };
      entry.totalPoints += item.points;
      entry.earnedPoints += item.earnedPoints;
      entry.questions += 1;
      skillMap.set(skill, entry);
    }
  }

  const skills = Array.from(skillMap.values())
    .map((entry) => ({
      ...entry,
      percentage: entry.totalPoints > 0 ? Math.round((entry.earnedPoints / entry.totalPoints) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return {
    resultId,
    overallPercentage: result.percentage,
    passed: result.passed,
    skills,
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
  getSkillBreakdown,
  candidatesMeResults,
  listForAssessment,
};
