import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import crypto from "crypto";

import { AttemptStatus, InvitationStatus } from "../../../generated/prisma/enums";

const assertAttemptOwnership = async (user: IAuthUser, attemptId: string) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { select: { companyId: true, createdBy: true } },
    },
  });
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");

  if (attempt.candidateId !== user.id) {
    if (user.role === "ADMIN") return attempt;
    if (user.role === "RECRUITER") {
      if (
        attempt.assessment.companyId === user.companyId ||
        attempt.assessment.createdBy === user.id
      ) {
        return attempt;
      }
    }
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this attempt");
  }
  return attempt;
};

const TERMINAL_STATUSES: AttemptStatus[] = [
  AttemptStatus.SUBMITTED,
  AttemptStatus.AUTO_SUBMITTED,
  AttemptStatus.COMPLETED,
  AttemptStatus.EXPIRED,
];

const start = async (
  user: IAuthUser,
  assessmentId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");

  if (assessment.status !== "ACTIVE" && assessment.status !== "PUBLISHED") {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Assessment cannot be started (current status: ${assessment.status})`,
    );
  }
  const now = new Date();
  if (assessment.startDate && now < assessment.startDate) {
    throw new ApiError(httpStatus.CONFLICT, "Assessment has not started yet");
  }
  if (assessment.endDate && now > assessment.endDate) {
    throw new ApiError(httpStatus.CONFLICT, "Assessment has already ended");
  }

  // Candidate must have a valid invitation
  const invitation = await prisma.invitation.findFirst({
    where: {
      assessmentId,
      OR: [
        { candidateId: user.id },
        { email: { equals: user.email, mode: "insensitive" } },
      ],
    },
  });
  if (!invitation) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not invited to this assessment");
  }
  if (
    invitation.status !== InvitationStatus.ACCEPTED &&
    invitation.status !== InvitationStatus.PENDING
  ) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Invitation status (${invitation.status}) does not allow starting an attempt`,
    );
  }
  if (invitation.expiresAt && now > invitation.expiresAt) {
    throw new ApiError(httpStatus.CONFLICT, "Invitation has expired");
  }

  // Count existing attempts and respect maxAttempts; the unique constraint
  // (assessmentId, candidateId, attemptNumber) guards against race conditions.
  const existing = await prisma.attempt.count({
    where: { assessmentId, candidateId: user.id },
  });
  if (existing >= assessment.maxAttempts) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Maximum attempts (${assessment.maxAttempts}) reached for this assessment`,
    );
  }
  const attemptNumber = existing + 1;

  const expiresAt = new Date(now.getTime() + assessment.durationMinutes * 60 * 1000);

  const attempt = await prisma.attempt.create({
    data: {
      assessmentId,
      candidateId: user.id,
      companyId: assessment.companyId,
      attemptNumber,
      status: AttemptStatus.IN_PROGRESS,
      startedAt: now,
      expiresAt,
    },
  });

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: InvitationStatus.ACCEPTED, acceptedAt: new Date() },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "attempt.start",
    entityType: "Attempt",
    entityId: attempt.id,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return attempt;
};
const autoSubmitIfExpired = async (attemptId: string) => {
  const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return attempt;
  if (
    attempt.status === AttemptStatus.IN_PROGRESS &&
    attempt.expiresAt &&
    attempt.expiresAt < new Date()
  ) {
    return prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.AUTO_SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }
  return attempt;
};

const getAttempt = async (user: IAuthUser, attemptId: string) => {
  const attempt = await assertAttemptOwnership(user, attemptId);
  if (attempt.candidateId === user.id) {
    return autoSubmitIfExpired(attemptId);
  }
  return attempt;
};

const getQuestions = async (user: IAuthUser, attemptId: string) => {
  const attempt = await assertAttemptOwnership(user, attemptId);

  if (attempt.candidateId === user.id) {
    if (TERMINAL_STATUSES.includes(attempt.status)) {
      // Still allow viewing questions but answers are frozen.
      const frozen = await autoSubmitIfExpired(attemptId);
      if (frozen?.status !== "IN_PROGRESS") {
        const questions = await prisma.assessmentProblem.findMany({
          where: { assessmentId: attempt.assessmentId },
          orderBy: { order: "asc" },
          include: {
            problem: {
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
        return questions;
      }
    }
  }

  const questions = await prisma.assessmentProblem.findMany({
    where: { assessmentId: attempt.assessmentId },
    orderBy: { order: "asc" },
    include: {
      problem: {
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
  return questions;
};

const saveAnswer = async (
  user: IAuthUser,
  attemptId: string,
  payload: {
    problemId: string;
    answer?: unknown;
    code?: string;
    programmingLanguage?: string;
  },
) => {
  const attempt = await assertAttemptOwnership(user, attemptId);
  if (attempt.candidateId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only the candidate can save answers");
  }
  const current = await autoSubmitIfExpired(attemptId);
  if (TERMINAL_STATUSES.includes(current!.status)) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Cannot save answers after the attempt has ended",
    );
  }
  if (current!.status !== AttemptStatus.IN_PROGRESS) {
    throw new ApiError(httpStatus.CONFLICT, "Attempt is not in progress");
  }

  const inAssessment = await prisma.assessmentProblem.findUnique({
    where: {
      assessmentId_problemId: {
        assessmentId: attempt.assessmentId,
        problemId: payload.problemId,
      },
    },
  });
  if (!inAssessment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Problem is not part of this assessment",
    );
  }

  const answer = await prisma.attemptAnswer.upsert({
    where: {
      attemptId_problemId: { attemptId, problemId: payload.problemId },
    },
    update: {
      answer: (payload.answer as never) ?? undefined,
      code: payload.code ?? undefined,
      programmingLanguage: payload.programmingLanguage ?? undefined,
      submittedAt: new Date(),
    },
    create: {
      attemptId,
      problemId: payload.problemId,
      answer: (payload.answer as never) ?? null,
      code: payload.code ?? null,
      programmingLanguage: payload.programmingLanguage ?? null,
      submittedAt: new Date(),
    },
  });

  return answer;
};
const updateAnswer = async (
  user: IAuthUser,
  attemptId: string,
  answerId: string,
  payload: { answer?: unknown; code?: string; programmingLanguage?: string },
) => {
  const attempt = await assertAttemptOwnership(user, attemptId);
  if (attempt.candidateId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only the candidate can update answers");
  }
  const current = await autoSubmitIfExpired(attemptId);
  if (TERMINAL_STATUSES.includes(current!.status)) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Cannot update answers after the attempt has ended",
    );
  }

  const answer = await prisma.attemptAnswer.findFirst({
    where: { id: answerId, attemptId },
  });
  if (!answer) throw new ApiError(httpStatus.NOT_FOUND, "Answer not found");

  const updated = await prisma.attemptAnswer.update({
    where: { id: answerId },
    data: {
      answer: (payload.answer as never) ?? undefined,
      code: payload.code ?? undefined,
      programmingLanguage: payload.programmingLanguage ?? undefined,
      submittedAt: new Date(),
    },
  });
  return updated;
};

const submit = async (
  user: IAuthUser,
  attemptId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const attempt = await assertAttemptOwnership(user, attemptId);
  if (attempt.candidateId !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only the candidate can submit");
  }

  const now = new Date();
  let targetStatus: AttemptStatus = AttemptStatus.SUBMITTED;
  if (attempt.expiresAt && attempt.expiresAt < now) {
    targetStatus = AttemptStatus.AUTO_SUBMITTED;
  }

  // Idempotent, race-safe submission: concurrently the second update matches 0 rows.
  const updated = await prisma.attempt.updateMany({
    where: {
      id: attemptId,
      status: { notIn: TERMINAL_STATUSES },
    },
    data: {
      status: targetStatus,
      submittedAt: now,
    },
  });

  if (updated.count === 0) {
    const existing = await prisma.attempt.findUnique({ where: { id: attemptId } });
    return { attempt: existing, alreadySubmitted: true };
  }

  await writeAuditLog({
    actorId: user.id,
    action: "attempt.submit",
    entityType: "Attempt",
    entityId: attemptId,
    newValue: { status: targetStatus },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  const fresh = await prisma.attempt.findUnique({ where: { id: attemptId } });
  let result = null;
  try {
    // Deferred import to avoid a circular dependency at module scope.
    const { EvaluationServices } = await import("../evaluations/evaluations.service");
    try {
      await EvaluationServices.autoEvaluateMcq(attemptId);
    } catch {
      // A failure in automatic MCQ evaluation must not block submission.
    }
    await EvaluationServices.recalculateResult(attemptId);
    result = await prisma.result.findUnique({
      where: { attemptId },
      include: { items: true },
    });
  } catch {
    // Result calculation must not fail the submission.
  }

  return { attempt: fresh, alreadySubmitted: false, result };
};

const candidatesMeAttempts = async (
  user: IAuthUser,
  query: { page?: number; limit?: number; status?: string },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = { candidateId: user.id };
  if (query.status) where.status = query.status;

  const [total, data] = await Promise.all([
    prisma.attempt.count({ where }),
    prisma.attempt.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            durationMinutes: true,
          },
        },
        result: true,
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getTime = async (user: IAuthUser, attemptId: string) => {
  const attempt = await assertAttemptOwnership(user, attemptId);
  if (attempt.candidateId === user.id) {
    await autoSubmitIfExpired(attemptId);
  }
  const fresh = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!fresh) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");

  const now = Date.now();
  const startedAt = fresh.startedAt?.getTime() ?? null;
  const expiresAt = fresh.expiresAt?.getTime() ?? null;
  const remainingTime =
    expiresAt !== null && fresh.status === "IN_PROGRESS"
      ? Math.max(0, Math.round((expiresAt - now) / 1000))
      : 0;

  return {
    attemptId: fresh.id,
    status: fresh.status,
    startedAt: fresh.startedAt,
    expiresAt: fresh.expiresAt,
    submittedAt: fresh.submittedAt,
    remainingTimeSeconds: remainingTime,
    serverTime: new Date(now).toISOString(),
  };
};

const getAntiCheatReport = async (user: IAuthUser, attemptId: string) => {
  const attempt = await assertAttemptOwnership(user, attemptId);
  void attempt;

  const events = await prisma.antiCheatingEvent.findMany({
    where: { attemptId },
    orderBy: { timestamp: "asc" },
  });

  const sessions = await prisma.attemptSession.findMany({
    where: { attemptId },
    orderBy: { startedAt: "asc" },
  });

  // Risk score calculation (configurable weights)
  const weights: Record<string, number> = {
    TAB_SWITCH: 5,
    FULLSCREEN_EXIT: 10,
    IP_CHANGE: 20,
    MULTIPLE_SESSION: 30,
    WINDOW_BLUR: 3,
    COPY: 2,
    PASTE: 2,
    SUSPICIOUS_ACTIVITY: 15,
  };
  let score = 0;
  const eventCounts: Record<string, number> = {};
  for (const event of events) {
    eventCounts[event.eventType] = (eventCounts[event.eventType] ?? 0) + 1;
    score += weights[event.eventType] ?? 0;
  }
  const uniqueIps = new Set(events.map((e) => e.ipAddress).filter(Boolean));
  const uniqueAgents = new Set(events.map((e) => e.userAgent).filter(Boolean));
  if (uniqueIps.size > 1) score += weights.IP_CHANGE ?? 20;
  if (sessions.length > 1 || uniqueAgents.size > 1) score += weights.MULTIPLE_SESSION ?? 30;

  const riskLevel = score >= 60 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";

  return {
    attemptId,
    riskScore: score,
    riskLevel,
    totalEvents: events.length,
    eventCounts,
    uniqueIpCount: uniqueIps.size,
    uniqueDeviceCount: uniqueAgents.size,
    sessionCount: sessions.length,
    suspiciousSessions: sessions.filter((s) => s.isSuspicious).length,
    timeline: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      timestamp: e.timestamp,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
      metadata: e.metadata,
    })),
    note: "Risk score is a signal, not proof of cheating.",
  };
};

const recordSession = async (
  attemptId: string,
  sessionId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const existing = await prisma.attemptSession.findUnique({
    where: { attemptId_sessionId: { attemptId, sessionId } },
  });
  if (existing) {
    return prisma.attemptSession.update({
      where: { id: existing.id },
      data: { lastSeenAt: new Date() },
    });
  }
  const sessionCount = await prisma.attemptSession.count({ where: { attemptId } });
  return prisma.attemptSession.create({
    data: {
      attemptId,
      sessionId,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      isSuspicious: sessionCount >= 1,
    },
  });
};

export const AttemptServices = {
  start,
  getAttempt,
  getQuestions,
  saveAnswer,
  updateAnswer,
  submit,
  candidatesMeAttempts,
  getTime,
  getAntiCheatReport,
  recordSession,
  assertAttemptOwnership,
  autoSubmitIfExpired,
};
