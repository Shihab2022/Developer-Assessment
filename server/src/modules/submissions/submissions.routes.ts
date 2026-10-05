import express from "express";
import { SubmissionController } from "./submissions.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  attemptSubmissionsQuerySchema,
  createSubmissionSchema,
  submissionParamsSchema,
} from "./submissions.validation";
import { submissionRateLimiter } from "../../middlewares/rateLimiter";

export const SubmissionRouter = express.Router();

SubmissionRouter.post(
  "/",
  submissionRateLimiter,
  auth("CANDIDATE"),
  validate(createSubmissionSchema),
  SubmissionController.create,
);

SubmissionRouter.get(
  "/:id",
  auth(),
  validate(submissionParamsSchema),
  SubmissionController.getById,
);

SubmissionRouter.post(
  "/:id/evaluate",
  auth("RECRUITER", "ADMIN"),
  validate(submissionParamsSchema),
  SubmissionController.evaluate,
);

export const attemptSubmissionsRouter = express.Router({ mergeParams: true });

attemptSubmissionsRouter.get(
  "/",
  auth(),
  validate(attemptSubmissionsQuerySchema),
  SubmissionController.listForAttempt,
);

/**
 * Assessment-scoped router mounted at `/assessments/:id/submissions`.
 * `:id` is an assessment id here, so it must not reuse the attempt handler.
 */
export const assessmentSubmissionsRouter = express.Router({ mergeParams: true });

assessmentSubmissionsRouter.get(
  "/",
  auth("RECRUITER", "ADMIN"),
  SubmissionController.listForAssessment,
);
