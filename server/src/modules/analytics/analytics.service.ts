import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { cacheGet, cacheSet, cacheDel } from "../../lib/redis";

const assertAccess = async (user: IAuthUser, assessmentId: string) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
    select: { id: true, companyId: true, createdBy: true },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  if (user.role === "ADMIN") return;
  if (user.role !== "RECRUITER") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only recruiters and admins can view analytics",
    );
  }
  if (
    assessment.companyId !== user.companyId &&
    assessment.createdBy !== user.id
  ) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this assessment",
    );
  }
};

const calculateMedian = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
};

const getAnalytics = async (user: IAuthUser, assessmentId: string) => {
  await assertAccess(user, assessmentId);

  const cacheKey = `analytics:assessment:${assessmentId}`;
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) return cached;

  const [attempts, results, invitations, resultItems] = await Promise.all([
    prisma.attempt.findMany({
      where: { assessmentId },
      select: {
        status: true,
        startedAt: true,
        submittedAt: true,
      },
    }),
    prisma.result.findMany({
      where: { assessmentId },
      select: {
        percentage: true,
        passed: true,
        earnedPoints: true,
        totalPoints: true,
        timeTakenSeconds: true,
      },
    }),
    prisma.invitation.count({ where: { assessmentId } }),
    prisma.resultItem.findMany({
      where: { result: { assessmentId } },
      include: {
        problem: {
          select: { title: true, difficulty: true, points: true },
        },
      },
    }),
  ]);

  const completed = attempts.filter(
    (a) =>
      a.status === "SUBMITTED" ||
      a.status === "AUTO_SUBMITTED" ||
      a.status === "COMPLETED" ||
      a.status === "EVALUATING",
  );
  const started = attempts.filter((a) => a.status !== "NOT_STARTED");
  const completionRate = invitations ? (completed.length / invitations) * 100 : 0;
  const percentages = results.map((r) => r.percentage);
  const averageScore = percentages.length
    ? percentages.reduce((a, b) => a + b, 0) / percentages.length
    : 0;
  const medianScore = calculateMedian(percentages);
  const passRate = results.length
    ? (results.filter((r) => r.passed).length / results.length) * 100
    : 0;
  const avgTime = results
    .filter((r) => r.timeTakenSeconds !== null)
    .map((r) => r.timeTakenSeconds as number);
  const averageTime = avgTime.length
    ? avgTime.reduce((a, b) => a + b, 0) / avgTime.length
    : 0;

  // Question difficulty/performance
  const questionPerf = new Map<
    string,
    {
      problemId: string;
      title: string;
      difficulty: string;
      attempts: number;
      correct: number;
      totalEarned: number;
      totalPoints: number;
    }
  >();
  for (const item of resultItems) {
    const key = item.problemId;
    const entry = questionPerf.get(key) ?? {
      problemId: key,
      title: item.problem.title,
      difficulty: item.problem.difficulty,
      attempts: 0,
      correct: 0,
      totalEarned: 0,
      totalPoints: 0,
    };
    entry.attempts += 1;
    if (item.earnedPoints > 0 && item.earnedPoints === item.points) {
      entry.correct += 1;
    }
    entry.totalEarned += item.earnedPoints;
    entry.totalPoints += item.points;
    questionPerf.set(key, entry);
  }
  const questionPerformance = Array.from(questionPerf.values()).map((entry) => ({
    ...entry,
    successRate: entry.attempts ? (entry.correct / entry.attempts) * 100 : 0,
  }));

  const mostFailed = [...questionPerformance]
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 5);

  // Performance distribution buckets
  const distribution = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
  for (const p of percentages) {
    if (p <= 25) distribution["0-25"] += 1;
    else if (p <= 50) distribution["26-50"] += 1;
    else if (p <= 75) distribution["51-75"] += 1;
    else distribution["76-100"] += 1;
  }

  const analytics = {
    assessmentId,
    summary: {
      totalInvitations: invitations,
      startedAttempts: started.length,
      completedAttempts: completed.length,
      completionRate: Math.round(completionRate * 100) / 100,
      averageScore: Math.round(averageScore * 100) / 100,
      medianScore: Math.round(medianScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      averageTimeSeconds: Math.round(averageTime),
    },
    questionPerformance,
    mostFailedQuestions: mostFailed,
    performanceDistribution: distribution,
  };

  await cacheSet(cacheKey, analytics, 300);
  return analytics;
};

export const invalidateAssessmentAnalytics = async (assessmentId: string) => {
  await cacheDel(`analytics:assessment:${assessmentId}`);
};

export const AnalyticsServices = {
  getAnalytics,
};