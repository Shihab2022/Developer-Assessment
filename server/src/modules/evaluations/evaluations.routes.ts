import express from "express";
import { EvaluationController } from "./evaluations.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  attemptEvaluationsQuery,
  writtenEvaluationSchema,
} from "./evaluations.validation";

export const EvaluationRouter = express.Router();

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
