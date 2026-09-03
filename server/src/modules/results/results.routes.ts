import express from "express";
import { ResultController } from "./results.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { candidateResultsQuerySchema, resultParamsSchema } from "./results.validation";
import { assessmentParams } from "../assessments/assessments.validation";

// Routes under /api/v1/results
export const ResultRouter = express.Router();

ResultRouter.get(
  "/:id",
  auth(),
  validate(resultParamsSchema),
  ResultController.getById,
);

// Routes under /api/v1/candidates/me/results
export const candidateResultRouter = express.Router();

candidateResultRouter.get(
  "/results",
  auth("CANDIDATE"),
  validate(candidateResultsQuerySchema),
  ResultController.candidatesMeResults,
);

// Assessment-scoped: GET /assessments/:id/results
export const assessmentResultRouter = express.Router();

assessmentResultRouter.get(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  ResultController.listForAssessment,
);