import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { cacheGet, cacheSet } from "../../lib/redis";

const assertAssessmentAccess = async (user: IAuthUser, assessmentId: string) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
    select: { id: true, companyId: true, createdBy: true, title: true },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  if (user.role === "ADMIN") return assessment;
  if (user.role !== "RECRUITER") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only recruiters and admins can view reports",
    );
  }
  if (assessment.companyId !== user.companyId && assessment.createdBy !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this assessment",
    );
  }
  return assessment;
};
const generateAssessmentReport = async (user: IAuthUser, assessmentId: string) => {
  const assessment = await assertAssessmentAccess(user, assessmentId);

  const cacheKey = `report:assessment:${assessmentId}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return cached;

  const results = await prisma.result.findMany({
    where: { assessmentId },
    select: {
      id: true,
      earnedPoints: true,
      totalPoints: true,
      percentage: true,
      passed: true,
      timeTakenSeconds: true,
      candidateId: true,
    },
  });

  const attempts = await prisma.attempt.findMany({
    where: { assessmentId },
    select: {
      candidateId: true,
      status: true,
      startedAt: true,
      submittedAt: true,
    },
  });

  const invitations = await prisma.invitation.count({
    where: { assessmentId },
  });

  const completedAttempts = attempts.filter(
    (a) =>
      a.status === "SUBMITTED" ||
      a.status === "AUTO_SUBMITTED" ||
      a.status === "COMPLETED" ||
      a.status === "EVALUATING",
  );
  const startedAttempts = attempts.filter((a) => a.status !== "NOT_STARTED");
  const uniqueCandidates = new Set(attempts.map((a) => a.candidateId)).size;

  const scores = results.map((r) => r.percentage);
  const averageScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
  const highestScore = scores.length ? Math.max(...scores) : 0;
  const lowestScore = scores.length ? Math.min(...scores) : 0;
  const passRate = results.length
    ? (results.filter((r) => r.passed).length / results.length) * 100
    : 0;

  const completionTimes = completedAttempts
    .filter((a) => a.startedAt && a.submittedAt)
    .map((a) =>
      Math.max(
        0,
        Math.round((a.submittedAt!.getTime() - a.startedAt!.getTime()) / 1000),
      ),
    );
  const averageCompletionTime = completionTimes.length
    ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
    : 0;

  // Question performance
  const resultItems = await prisma.resultItem.findMany({
    where: { result: { assessmentId } },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          type: true,
          difficulty: true,
          category: true,
        },
      },
    },
  });

  const questionPerformance = new Map<
    string,
    {
      problemId: string;
      title: string;
      type: string;
      difficulty: string;
      category: string | null;
      attempts: number;
      correct: number;
      averageScore: number;
    }
  >();
  for (const item of resultItems) {
    const key = item.problemId;
    const entry = questionPerformance.get(key) ?? {
      problemId: key,
      title: item.problem.title,
      type: item.problem.type,
      difficulty: item.problem.difficulty,
      category: item.problem.category,
      attempts: 0,
      correct: 0,
      averageScore: 0,
    };
    entry.attempts += 1;
    if (item.earnedPoints > 0 && item.earnedPoints === item.points) {
      entry.correct += 1;
    }
    entry.averageScore += item.earnedPoints;
    questionPerformance.set(key, entry);
  }
  const questionPerformanceArr = Array.from(questionPerformance.values()).map(
    (entry) => ({
      ...entry,
      averageScore: entry.attempts ? entry.averageScore / entry.attempts : 0,
      successRate: entry.attempts ? (entry.correct / entry.attempts) * 100 : 0,
    }),
  );

  // Candidate ranking
  const candidateIds = Array.from(new Set(results.map((r) => r.candidateId)));
  const candidates = candidateIds.length
    ? await prisma.user.findMany({
        where: { id: { in: candidateIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const candidateMap = new Map(candidates.map((c) => [c.id, c]));
  const candidateRanking = results
    .map((r) => ({
      candidateId: r.candidateId,
      name: candidateMap.get(r.candidateId)?.name ?? "Unknown",
      email: candidateMap.get(r.candidateId)?.email ?? "",
      percentage: r.percentage,
      passed: r.passed,
      timeTakenSeconds: r.timeTakenSeconds,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Skill/category performance
  const categoryMap = new Map<
    string,
    { category: string; attempts: number; totalScore: number; maxScore: number }
  >();
  for (const item of resultItems) {
    const cat = item.problem.category ?? "Uncategorized";
    const entry = categoryMap.get(cat) ?? {
      category: cat,
      attempts: 0,
      totalScore: 0,
      maxScore: 0,
    };
    entry.attempts += 1;
    entry.totalScore += item.earnedPoints;
    entry.maxScore += item.points;
    categoryMap.set(cat, entry);
  }
  const categoryPerformance = Array.from(categoryMap.values()).map((entry) => ({
    category: entry.category,
    attempts: entry.attempts,
    accuracy: entry.maxScore ? (entry.totalScore / entry.maxScore) * 100 : 0,
  }));

  const report = {
    assessmentId,
    assessmentTitle: assessment.title,
    summary: {
      invitationCount: invitations,
      uniqueCandidates,
      startedAttempts: startedAttempts.length,
      completedAttempts: completedAttempts.length,
      completionRate: invitations ? (completedAttempts.length / invitations) * 100 : 0,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: Math.round(passRate * 100) / 100,
      averageCompletionTimeSeconds: Math.round(averageCompletionTime),
    },
    questionPerformance: questionPerformanceArr,
    candidateRanking,
    categoryPerformance,
    generatedAt: new Date().toISOString(),
  };

  await cacheSet(cacheKey, report, 600);
  return report;
};
const generateCompanyReport = async (user: IAuthUser, companyId: string) => {
  if (user.role === "ADMIN") {
    // ok
  } else if (user.role === "RECRUITER") {
    if (user.companyId !== companyId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have access to this company",
      );
    }
  } else {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only recruiters and admins can view company reports",
    );
  }

  const company = await prisma.company.findFirst({
    where: { id: companyId, deletedAt: null },
  });
  if (!company) throw new ApiError(httpStatus.NOT_FOUND, "Company not found");

  const assessments = await prisma.assessment.findMany({
    where: { companyId, deletedAt: null },
    select: { id: true, title: true, status: true },
  });

  const assessmentIds = assessments.map((a) => a.id);
  const results = assessmentIds.length
    ? await prisma.result.findMany({
        where: { assessmentId: { in: assessmentIds } },
        select: {
          earnedPoints: true,
          totalPoints: true,
          percentage: true,
          passed: true,
          candidateId: true,
        },
      })
    : [];

  const uniqueCandidateIds = new Set(results.map((r) => r.candidateId));
  const averageScore = results.length
    ? results.reduce((a, b) => a + b.percentage, 0) / results.length
    : 0;
  const passRate = results.length
    ? (results.filter((r) => r.passed).length / results.length) * 100
    : 0;

  return {
    companyId,
    companyName: company.name,
    summary: {
      totalAssessments: assessments.length,
      totalCandidates: uniqueCandidateIds.size,
      completedResults: results.length,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
    },
    assessments: assessments.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
    })),
  };
};

const listForCompany = async (
  user: IAuthUser,
  companyId: string,
  page = 1,
  limit = 10,
) => {
  if (user.role === "RECRUITER" && user.companyId !== companyId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this company");
  }
  const where = { companyId, deletedAt: null };
  const [total, data] = await Promise.all([
    prisma.assessment.count({ where }),
    prisma.assessment.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: { select: { attempts: true, results: true } },
      },
    }),
  ]);
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const ReportServices = {
  generateAssessmentReport,
  generateCompanyReport,
  listForCompany,
};
