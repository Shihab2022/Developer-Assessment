import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { codeRunner } from "../../lib/codeRunner";
import {
  AttemptStatus,
  EvaluationStatus,
  ProblemType,
  SubmissionStatus,
} from "../../../generated/prisma/enums";

/**
 * MCQ Evaluator: compares the candidate's selected option with the problem's
 * correct option. Fully automatic.
 */
const evaluateMcqForProblem = async (
  attemptId: string,
  problemId: string,
  selected: unknown,
  maxScore: number,
) => {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { options: true },
  });
  if (!problem) return null;

  const correctOption = problem.options.find((o) => o.isCorrect === true);
  if (!correctOption) return null;

  let isCorrect = false;
  if (
    typeof selected === "object" &&
    selected !== null &&
    "selectedOptionId" in (selected as Record<string, unknown>)
  ) {
    isCorrect =
      (selected as { selectedOptionId?: string }).selectedOptionId ===
      correctOption.id;
  } else if (typeof selected === "object" && selected !== null) {
    const record = selected as Record<string, unknown>;
    if ("selectedOptionIndex" in record) {
      const sorted = [...problem.options].sort((a, b) => a.order - b.order);
      isCorrect =
        sorted[Number(record.selectedOptionIndex)]?.id === correctOption.id;
    } else if ("answerIndex" in record) {
      const sorted = [...problem.options].sort((a, b) => a.order - b.order);
      isCorrect =
        sorted[Number(record.answerIndex)]?.id === correctOption.id;
    }
  }

  const score = isCorrect ? maxScore : 0;

  const existing = await prisma.evaluation.findFirst({
    where: { attemptId, problemId, type: ProblemType.MCQ },
  });

  const evaluation = existing
    ? await prisma.evaluation.update({
        where: { id: existing.id },
        data: {
          score,
          status: EvaluationStatus.COMPLETED,
          feedback: isCorrect ? "Correct" : "Incorrect",
          evaluatedAt: new Date(),
        },
      })
    : await prisma.evaluation.create({
        data: {
          attemptId,
          problemId,
          type: ProblemType.MCQ,
          score,
          maxScore,
          status: EvaluationStatus.COMPLETED,
          feedback: isCorrect ? "Correct" : "Incorrect",
          evaluatedAt: new Date(),
        },
      });

  return evaluation;
};

const autoEvaluateMcq = async (attemptId: string) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { include: { problems: { include: { problem: true } } } },
      answers: true,
    },
  });
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");

  const mcqProblems = attempt.assessment.problems.filter(
    (ap) => ap.problem.type === ProblemType.MCQ,
  );

  for (const ap of mcqProblems) {
    const answer = attempt.answers.find((a) => a.problemId === ap.problemId);
    if (!answer || answer.answer === null) continue;
    await evaluateMcqForProblem(attemptId, ap.problemId, answer.answer, ap.points);
  }
};const evaluateWritten = async (
  user: IAuthUser,
  payload: { attemptId: string; problemId: string; score: number; feedback?: string },
  meta: { ip?: string; userAgent?: string },
) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: payload.attemptId },
  });
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");

  const assessment = await prisma.assessment.findUnique({
    where: { id: attempt.assessmentId },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");

  if (user.role === "RECRUITER") {
    if (
      assessment.companyId !== user.companyId &&
      assessment.createdBy !== user.id
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have access to this attempt",
      );
    }
  } else if (user.role !== "ADMIN") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only recruiters or admins can evaluate written answers",
    );
  }

  const problem = await prisma.problem.findFirst({
    where: { id: payload.problemId, deletedAt: null },
  });
  if (!problem) throw new ApiError(httpStatus.NOT_FOUND, "Problem not found");
  if (problem.type !== ProblemType.WRITTEN) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Manual evaluation is only supported for WRITTEN problems",
    );
  }

  const ap = await prisma.assessmentProblem.findUnique({
    where: {
      assessmentId_problemId: {
        assessmentId: attempt.assessmentId,
        problemId: payload.problemId,
      },
    },
  });
  if (!ap) throw new ApiError(httpStatus.BAD_REQUEST, "Problem not in assessment");
  if (payload.score < 0 || payload.score > ap.points) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Score must be between 0 and ${ap.points}`,
    );
  }

  const existing = await prisma.evaluation.findFirst({
    where: { attemptId: payload.attemptId, problemId: payload.problemId, type: ProblemType.WRITTEN },
  });

  const evaluation = existing
    ? await prisma.evaluation.update({
        where: { id: existing.id },
        data: {
          score: payload.score,
          maxScore: ap.points,
          feedback: payload.feedback,
          status: EvaluationStatus.COMPLETED,
          evaluatorId: user.id,
          evaluatedAt: new Date(),
        },
      })
    : await prisma.evaluation.create({
        data: {
          attemptId: payload.attemptId,
          problemId: payload.problemId,
          type: ProblemType.WRITTEN,
          score: payload.score,
          maxScore: ap.points,
          feedback: payload.feedback,
          status: EvaluationStatus.COMPLETED,
          evaluatorId: user.id,
          evaluatedAt: new Date(),
        },
      });

  const result = await recalculateResult(payload.attemptId);

  await writeAuditLog({
    actorId: user.id,
    action: "evaluation.written",
    entityType: "Evaluation",
    entityId: evaluation.id,
    newValue: { score: payload.score },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return { evaluation, result };
};

const evaluateCodingSubmission = async (submissionId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: { include: { testCases: { orderBy: { order: "asc" } } } },
      attempt: true,
    },
  });
  if (!submission) throw new ApiError(httpStatus.NOT_FOUND, "Submission not found");
  if (!submission.code) throw new ApiError(httpStatus.BAD_REQUEST, "Submission has no code");

  const ap = await prisma.assessmentProblem.findUnique({
    where: {
      assessmentId_problemId: {
        assessmentId: submission.assessmentId,
        problemId: submission.problemId,
      },
    },
  });
  const maxScore = ap?.points ?? submission.problem.points;

  // Mark as running before dispatching to the sandbox.
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: SubmissionStatus.RUNNING },
  });

  // NEVER execute arbitrary code in the API server. Dispatch to the code runner.
  const execution = await codeRunner.execute(
    submission.code,
    submission.programmingLanguage ?? "javascript",
    submission.problem.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
    })),
  );

  const score = Math.round(maxScore * (execution.score / 100));

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: execution.status as never,
      score,
      executionTime: execution.executionTime,
      memoryUsed: execution.memoryUsed,
      evaluationResult: {
        message: execution.message,
        passedCount: execution.passedCount,
        totalCount: execution.totalCount,
        testResults: execution.testResults,
      } as never,
    },
  });

  const existing = await prisma.evaluation.findFirst({
    where: {
      submissionId,
      problemId: submission.problemId,
      type: ProblemType.CODING,
    },
  });
  const evaluation = existing
    ? await prisma.evaluation.update({
        where: { id: existing.id },
        data: {
          score,
          maxScore,
          status: EvaluationStatus.COMPLETED,
          evaluatedAt: new Date(),
          feedback: execution.message,
        },
      })
    : await prisma.evaluation.create({
        data: {
          submissionId,
          attemptId: submission.attemptId,
          problemId: submission.problemId,
          type: ProblemType.CODING,
          score,
          maxScore,
          status: EvaluationStatus.COMPLETED,
          evaluatedAt: new Date(),
          feedback: execution.message,
        },
      });
  void evaluation;

  const result = await recalculateResult(submission.attemptId);
  return { submission: updated, result };
};const recalculateResult = async (attemptId: string) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      assessment: { include: { problems: { orderBy: { order: "asc" } } } },
    },
  });
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");

  const evaluations = await prisma.evaluation.findMany({
    where: { attemptId, status: EvaluationStatus.COMPLETED },
  });
  const submissions = await prisma.submission.findMany({
    where: { attemptId, status: { in: [SubmissionStatus.PASSED, SubmissionStatus.PARTIAL, SubmissionStatus.FAILED] } },
  });

  const evaluationByProblem = new Map<
    string,
    { score: number; feedback?: string | null }
  >();
  for (const ev of evaluations) {
    evaluationByProblem.set(ev.problemId, {
      score: ev.score ?? 0,
      feedback: ev.feedback,
    });
  }
  for (const sub of submissions) {
    if (evaluationByProblem.has(sub.problemId)) continue;
    evaluationByProblem.set(sub.problemId, {
      score: sub.score ?? 0,
      feedback: sub.status,
    });
  }

  const totalPoints = attempt.assessment.problems.reduce(
    (sum, ap) => sum + ap.points,
    0,
  );
  let earnedPoints = 0;
  const items = attempt.assessment.problems.map((ap) => {
    const earned = Math.min(evaluationByProblem.get(ap.problemId)?.score ?? 0, ap.points);
    earnedPoints += earned;
    const submission = submissions.find((s) => s.problemId === ap.problemId);
    return {
      problemId: ap.problemId,
      points: ap.points,
      earnedPoints: earned,
      status:
        earned === ap.points
          ? "FULL"
          : earned === 0
            ? "EMPTY"
            : "PARTIAL",
      feedback: evaluationByProblem.get(ap.problemId)?.feedback ?? null,
      submissionId: submission?.id ?? null,
    };
  });

  const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  const passed = earnedPoints >= attempt.assessment.passingScore;
  const timeTakenSeconds = attempt.submittedAt
    ? Math.max(
        0,
        Math.round(
          (attempt.submittedAt.getTime() - (attempt.startedAt ?? attempt.submittedAt).getTime()) / 1000,
        ),
      )
    : null;

  const result = await prisma.$transaction(async (tx) => {
    await tx.resultItem.deleteMany({ where: { result: { attemptId } } });
    const existing = await tx.result.findUnique({ where: { attemptId } });
    const saved = existing
      ? await tx.result.update({
          where: { attemptId },
          data: {
            totalPoints,
            earnedPoints,
            percentage: Math.round(percentage * 100) / 100,
            passed,
            timeTakenSeconds,
          },
        })
      : await tx.result.create({
          data: {
            attemptId,
            candidateId: attempt.candidateId,
            assessmentId: attempt.assessmentId,
            totalPoints,
            earnedPoints,
            percentage: Math.round(percentage * 100) / 100,
            passed,
            timeTakenSeconds,
            releasedAt: attempt.assessment.showResults ? new Date() : null,
          },
        });
    if (items.length > 0) {
      await tx.resultItem.createMany({
        data: items.map((item) => ({
          resultId: saved.id,
          problemId: item.problemId,
          points: item.points,
          earnedPoints: item.earnedPoints,
          status: item.status,
          feedback: item.feedback,
          submissionId: item.submissionId,
        })),
      });
    }
    return saved;
  });

  if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.AUTO_SUBMITTED) {
    await prisma.attempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.COMPLETED, score: earnedPoints, maxScore: totalPoints },
    });
  }

  return prisma.result.findUnique({
    where: { attemptId },
    include: { items: true },
  });
};

const listForAttempt = async (user: IAuthUser, attemptId: string) => {
  const { AttemptServices } = await import("../attempts/attempts.service");
  await AttemptServices.assertAttemptOwnership(user, attemptId);
  const evaluations = await prisma.evaluation.findMany({
    where: { attemptId },
    orderBy: { createdAt: "asc" },
    include: {
      problem: { select: { id: true, title: true, type: true } },
      evaluator: { select: { id: true, name: true } },
    },
  });
  return evaluations;
};

export const EvaluationServices = {
  autoEvaluateMcq,
  evaluateWritten,
  evaluateCodingSubmission,
  recalculateResult,
  listForAttempt,
};