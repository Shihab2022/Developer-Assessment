import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { AttemptServices } from "../attempts/attempts.service";
import { ProblemType, SubmissionStatus } from "../../../generated/prisma/enums";

const create = async (
  user: IAuthUser,
  payload: {
    attemptId: string;
    problemId: string;
    code: string;
    programmingLanguage: string;
  },
  meta: { ip?: string; userAgent?: string },
) => {
  const attempt = await AttemptServices.assertAttemptOwnership(user, payload.attemptId);
  if (attempt.candidateId !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only submit code for your own attempts",
    );
  }

  const freshAttempt = await AttemptServices.autoSubmitIfExpired(payload.attemptId);
  if (freshAttempt?.status !== "IN_PROGRESS") {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Cannot submit code after the attempt has ended",
    );
  }

  const problem = await prisma.problem.findFirst({
    where: { id: payload.problemId, deletedAt: null },
  });
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
  if (problem.type !== ProblemType.CODING) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Code submissions are only allowed for CODING problems",
    );
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

  // Prevent conflicting concurrent submissions for the same problem while one is running.
  const running = await prisma.submission.count({
    where: {
      attemptId: payload.attemptId,
      problemId: payload.problemId,
      status: { in: [SubmissionStatus.PENDING, SubmissionStatus.RUNNING] },
    },
  });
  if (running > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A submission for this problem is already being processed",
    );
  }

  const submission = await prisma.submission.create({
    data: {
      attemptId: payload.attemptId,
      candidateId: user.id,
      assessmentId: attempt.assessmentId,
      problemId: payload.problemId,
      code: payload.code,
      programmingLanguage: payload.programmingLanguage,
      status: SubmissionStatus.PENDING,
    },
  });

  await prisma.attemptAnswer.upsert({
    where: {
      attemptId_problemId: {
        attemptId: payload.attemptId,
        problemId: payload.problemId,
      },
    },
    update: {
      code: payload.code,
      programmingLanguage: payload.programmingLanguage,
      submittedAt: new Date(),
    },
    create: {
      attemptId: payload.attemptId,
      problemId: payload.problemId,
      code: payload.code,
      programmingLanguage: payload.programmingLanguage,
      submittedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "submission.create",
    entityType: "Submission",
    entityId: submission.id,
    newValue: { problemId: payload.problemId, language: payload.programmingLanguage },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return submission;
};
const getById = async (user: IAuthUser, submissionId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: { select: { id: true, title: true, type: true } },
      attempt: { select: { id: true, assessmentId: true } },
    },
  });
  if (!submission) throw new ApiError(httpStatus.NOT_FOUND, "Submission not found");

  let canAccess = submission.candidateId === user.id || user.role === "ADMIN";
  if (!canAccess && user.role === "RECRUITER") {
    const assessment = await prisma.assessment.findUnique({
      where: { id: submission.attempt.assessmentId },
      select: { companyId: true, createdBy: true },
    });
    canAccess =
      assessment !== null &&
      (assessment.companyId === user.companyId || assessment.createdBy === user.id);
  }

  if (!canAccess) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You do not have access to this submission",
    );
  }
  return submission;
};

const listForAttempt = async (user: IAuthUser, attemptId: string) => {
  await AttemptServices.assertAttemptOwnership(user, attemptId);
  const submissions = await prisma.submission.findMany({
    where: { attemptId },
    orderBy: { createdAt: "desc" },
    include: {
      problem: { select: { id: true, title: true, type: true } },
    },
  });
  return submissions;
};

const evaluate = async (
  user: IAuthUser,
  submissionId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) throw new ApiError(httpStatus.NOT_FOUND, "Submission not found");

  const assessment = await prisma.assessment.findUnique({
    where: { id: submission.assessmentId },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  if (user.role === "RECRUITER") {
    if (assessment.companyId !== user.companyId && assessment.createdBy !== user.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have access to this submission",
      );
    }
  } else if (user.role === "CANDIDATE") {
    throw new ApiError(httpStatus.FORBIDDEN, "Candidates cannot trigger evaluation");
  }

  const { EvaluationServices } = await import("../evaluations/evaluations.service");
  const { submission: evaluated, result } =
    await EvaluationServices.evaluateCodingSubmission(submissionId);

  await writeAuditLog({
    actorId: user.id,
    action: "submission.evaluate",
    entityType: "Submission",
    entityId: submissionId,
    newValue: { status: evaluated.status, score: evaluated.score },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return {
    status: evaluated.status,
    score: evaluated.score,
    submission: evaluated,
    result,
  };
};

export const SubmissionServices = {
  create,
  getById,
  listForAttempt,
  evaluate,
};
