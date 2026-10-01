import express from "express";
import { InterviewController } from "./interviews.controller";
import auth, { optionalAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  addQuestionSchema,
  createInterviewSchema,
  createSessionLinkSchema,
  interviewListQuerySchema,
  interviewParamsSchema,
  interviewQuestionParamsSchema,
  interviewSessionParamsSchema,
  interviewSessionsQuerySchema,
  regenerateQuestionsSchema,
  reportViolationSchema,
  saveAnswerSchema,
  sessionTokenParamsSchema,
  startSessionSchema,
  submitSessionSchema,
  updateInterviewSchema,
  updateQuestionSchema,
} from "./interviews.validation";
import {
  interviewSessionRateLimiter,
  submissionRateLimiter,
} from "../../middlewares/rateLimiter";

/**
 * Recruiter/admin API — create proctored video interviews, manage the question
 * set, publish the candidate link and read the AI reports.
 * Mounted at `/api/v1/interviews`.
 */
export const InterviewRouter = express.Router();

InterviewRouter.get("/technologies", auth(), InterviewController.technologies);

InterviewRouter.post(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(createInterviewSchema),
  InterviewController.create,
);

InterviewRouter.get("/", auth(), validate(interviewListQuerySchema), InterviewController.list);

InterviewRouter.get(
  "/:id",
  auth(),
  validate(interviewParamsSchema),
  InterviewController.getOne,
);

InterviewRouter.patch(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(updateInterviewSchema),
  InterviewController.update,
);

InterviewRouter.delete(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(interviewParamsSchema),
  InterviewController.remove,
);

InterviewRouter.post(
  "/:id/publish",
  auth("RECRUITER", "ADMIN"),
  validate(interviewParamsSchema),
  InterviewController.publish,
);

InterviewRouter.post(
  "/:id/close",
  auth("RECRUITER", "ADMIN"),
  validate(interviewParamsSchema),
  InterviewController.close,
);

InterviewRouter.post(
  "/:id/regenerate-questions",
  auth("RECRUITER", "ADMIN"),
  validate(regenerateQuestionsSchema),
  InterviewController.regenerateQuestions,
);

InterviewRouter.post(
  "/:id/questions",
  auth("RECRUITER", "ADMIN"),
  validate(addQuestionSchema),
  InterviewController.addQuestion,
);

InterviewRouter.patch(
  "/:id/questions/:questionId",
  auth("RECRUITER", "ADMIN"),
  validate(updateQuestionSchema),
  InterviewController.updateQuestion,
);

InterviewRouter.delete(
  "/:id/questions/:questionId",
  auth("RECRUITER", "ADMIN"),
  validate(interviewQuestionParamsSchema),
  InterviewController.removeQuestion,
);

InterviewRouter.post(
  "/:id/sessions",
  auth("RECRUITER", "ADMIN"),
  validate(createSessionLinkSchema),
  InterviewController.createSessionLink,
);

InterviewRouter.get(
  "/:id/sessions",
  auth(),
  validate(interviewSessionsQuerySchema),
  InterviewController.listSessions,
);

InterviewRouter.get(
  "/:id/sessions/:sessionId",
  auth(),
  validate(interviewSessionParamsSchema),
  InterviewController.getSessionReport,
);

InterviewRouter.post(
  "/:id/sessions/:sessionId/review",
  auth("RECRUITER", "ADMIN"),
  validate(interviewSessionParamsSchema),
  InterviewController.reReviewSession,
);

InterviewRouter.get(
  "/:id/report",
  auth(),
  validate(interviewParamsSchema),
  InterviewController.report,
);

/**
 * Candidate API — reached from the public interview link, so no login is
 * required (`optionalAuth` links a signed-in candidate to the session).
 * Mounted at `/api/v1/interview-sessions`.
 */
export const InterviewSessionRouter = express.Router();

InterviewSessionRouter.get(
  "/:token",
  interviewSessionRateLimiter,
  validate(sessionTokenParamsSchema),
  InterviewController.publicInterview,
);

InterviewSessionRouter.post(
  "/:token/start",
  optionalAuth,
  validate(startSessionSchema),
  InterviewController.startSession,
);

InterviewSessionRouter.get(
  "/:token/state",
  validate(sessionTokenParamsSchema),
  InterviewController.sessionState,
);

InterviewSessionRouter.post(
  "/:token/violations",
  submissionRateLimiter,
  validate(reportViolationSchema),
  InterviewController.reportViolation,
);

InterviewSessionRouter.post(
  "/:token/answers/:questionId",
  submissionRateLimiter,
  validate(saveAnswerSchema),
  InterviewController.saveAnswer,
);

InterviewSessionRouter.post(
  "/:token/submit",
  validate(submitSessionSchema),
  InterviewController.submitSession,
);

InterviewSessionRouter.get(
  "/:token/result",
  validate(sessionTokenParamsSchema),
  InterviewController.sessionResult,
);

