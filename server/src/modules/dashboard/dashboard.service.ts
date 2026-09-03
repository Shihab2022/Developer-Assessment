import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";

const recruiterDashboard = async (user: IAuthUser) => {
  if (user.role !== "RECRUITER" && user.role !== "ADMIN") {
    throw new ApiError(httpStatus.FORBIDDEN, "Only recruiters can access this dashboard");
  }
  const companyId = user.role === "RECRUITER" ? user.companyId ?? null : null;
  const companyFilter: Record<string, unknown> = companyId ? { companyId } : {};
  const [
    totalAssessments, activeAssessments, draftAssessments, closedAssessments,
    totalInvitations, pendingInvitations, acceptedInvitations,
    totalAttempts, completedAttempts, inProgressAttempts,
    totalResults, passedResults,
    totalProblems, activeProblems,
    recentAssessments, recentResults, pendingEvaluations,
  ] = await Promise.all([
    prisma.assessment.count({ where: { ...companyFilter, deletedAt: null } }),
    prisma.assessment.count({ where: { ...companyFilter, status: "PUBLISHED", deletedAt: null } }),
    prisma.assessment.count({ where: { ...companyFilter, status: "DRAFT", deletedAt: null } }),
    prisma.assessment.count({ where: { ...companyFilter, status: "CLOSED", deletedAt: null } }),
    prisma.invitation.count({ where: { ...companyFilter } }),
    prisma.invitation.count({ where: { ...companyFilter, status: "PENDING" } }),
    prisma.invitation.count({ where: { ...companyFilter, status: "ACCEPTED" } }),
    prisma.attempt.count({ where: { ...companyFilter } }),
    prisma.attempt.count({ where: { ...companyFilter, status: { in: ["COMPLETED", "SUBMITTED", "AUTO_SUBMITTED"] } } }),
    prisma.attempt.count({ where: { ...companyFilter, status: "IN_PROGRESS" } }),
    prisma.result.count({ where: { ...companyFilter } }),
    prisma.result.count({ where: { ...companyFilter, passed: true } }),
    prisma.problem.count({ where: { ...companyFilter, deletedAt: null } }),
    prisma.problem.count({ where: { ...companyFilter, status: "ACTIVE", deletedAt: null } }),
    prisma.assessment.findMany({ where: { ...companyFilter, deletedAt: null }, take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, createdAt: true } }),
    prisma.result.findMany({ where: { ...companyFilter }, take: 5, orderBy: { createdAt: "desc" }, include: { candidate: { select: { id: true, name: true } }, assessment: { select: { id: true, title: true } } } }),
    prisma.evaluation.count({ where: { status: "PENDING" } }),
  ]);
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;
  const completionRate = totalInvitations > 0 ? Math.round((acceptedInvitations / totalInvitations) * 100) : 0;
  return {
    summary: { totalAssessments, activeAssessments, draftAssessments, closedAssessments, totalInvitations, pendingInvitations, acceptedInvitations, totalAttempts, completedAttempts, inProgressAttempts, totalResults, passedResults, passRate, completionRate, totalProblems, activeProblems, pendingEvaluations },
    recentAssessments, recentResults,
  };
};

const candidateDashboard = async (user: IAuthUser) => {
  if (user.role !== "CANDIDATE") throw new ApiError(httpStatus.FORBIDDEN, "Only candidates can access this dashboard");
  const [totalInvitations, pendingInvitations, acceptedInvitations, totalAttempts, completedAttempts, inProgressAttempts, totalResults, passedResults, upcomingAssessments, recentResults] = await Promise.all([
    prisma.invitation.count({ where: { OR: [{ candidateId: user.id }, { email: { equals: user.email, mode: "insensitive" } }], assessment: { deletedAt: null } } }),
    prisma.invitation.count({ where: { OR: [{ candidateId: user.id }, { email: { equals: user.email, mode: "insensitive" } }], status: "PENDING", assessment: { deletedAt: null } } }),
    prisma.invitation.count({ where: { OR: [{ candidateId: user.id }, { email: { equals: user.email, mode: "insensitive" } }], status: "ACCEPTED", assessment: { deletedAt: null } } }),
    prisma.attempt.count({ where: { candidateId: user.id } }),
    prisma.attempt.count({ where: { candidateId: user.id, status: { in: ["COMPLETED", "SUBMITTED", "AUTO_SUBMITTED"] } } }),
    prisma.attempt.count({ where: { candidateId: user.id, status: "IN_PROGRESS" } }),
    prisma.result.count({ where: { candidateId: user.id, releasedAt: { not: null } } }),
    prisma.result.count({ where: { candidateId: user.id, passed: true, releasedAt: { not: null } } }),
    prisma.invitation.findMany({ where: { OR: [{ candidateId: user.id }, { email: { equals: user.email, mode: "insensitive" } }], status: "PENDING", assessment: { deletedAt: null } }, take: 5, orderBy: { createdAt: "desc" }, include: { assessment: { select: { id: true, title: true, durationMinutes: true, startDate: true } } } }),
    prisma.result.findMany({ where: { candidateId: user.id, releasedAt: { not: null } }, take: 5, orderBy: { createdAt: "desc" }, include: { assessment: { select: { id: true, title: true } } } }),
  ]);
  const passRate = totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0;
  return { summary: { totalInvitations, pendingInvitations, acceptedInvitations, totalAttempts, completedAttempts, inProgressAttempts, totalResults, passedResults, passRate }, upcomingAssessments, recentResults };
};

export const DashboardServices = { recruiterDashboard, candidateDashboard };
