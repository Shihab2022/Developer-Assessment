import express from "express";
import { EvaluationController } from "./evaluations.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  attemptEvaluationsQuery,
  writtenEvaluationSchema,
} from "./evaluations.validation";

export const EvaluationRouter = express.Router();

EvaluationRouter.get(
  "/pending",
  auth("RECRUITER", "ADMIN"),
  EvaluationController.listPending,
);

EvaluationRouter.post(
  "/written",
  auth("RECRUITER", "ADMIN"),
  validate(writtenEvaluationSchema),
  EvaluationController.evaluateWritten,
);

export const attemptEvaluationRouter = express.Router({ mergeParams: true });

attemptEvaluationRouter.get(
  "/",
  auth(),
  validate(attemptEvaluationsQuery),
  EvaluationController.listForAttempt,
);

/**
 * Assessment-scoped router mounted at `/assessments/:id/evaluations`.
 * `:id` is an assessment id here, so it must not reuse the attempt handler.
 */
export const assessmentEvaluationRouter = express.Router({ mergeParams: true });

assessmentEvaluationRouter.get(
  "/",
  auth("RECRUITER", "ADMIN"),
  EvaluationController.listForAssessment,
);
