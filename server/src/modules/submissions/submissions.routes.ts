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

export const attemptSubmissionsRouter = express.Router();

attemptSubmissionsRouter.get(
  "/",
  auth(),
  validate(attemptSubmissionsQuerySchema),
  SubmissionController.listForAttempt,
);