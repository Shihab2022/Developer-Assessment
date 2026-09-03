import express from "express";
import { AttemptController } from "./attempts.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  antiCheatingEventSchema,
  attemptParamsSchema,
  candidatesAttemptsQuerySchema,
  saveAnswerSchema,
  updateAnswerSchema,
} from "./attempts.validation";
import { assessmentParams } from "../assessments/assessments.validation";
import { submissionRateLimiter } from "../../middlewares/rateLimiter";
import { AntiCheatingController } from "../anti-cheating/anti-cheating.controller";

export const AttemptRouter = express.Router();

AttemptRouter.get(
  "/:id",
  auth(),
  validate(attemptParamsSchema),
  AttemptController.getAttempt,
);

AttemptRouter.get(
  "/:id/questions",
  auth(),
  validate(attemptParamsSchema),
  AttemptController.getQuestions,
);

AttemptRouter.post(
  "/:id/answers",
  submissionRateLimiter,
  auth("CANDIDATE"),
  validate(saveAnswerSchema),
  AttemptController.saveAnswer,
);

AttemptRouter.patch(
  "/:id/answers/:answerId",
  submissionRateLimiter,
  auth("CANDIDATE"),
  validate(updateAnswerSchema),
  AttemptController.updateAnswer,
);

AttemptRouter.post(
  "/:id/submit",
  auth("CANDIDATE"),
  validate(attemptParamsSchema),
  AttemptController.submit,
);

AttemptRouter.post(
  "/:id/anti-cheating-events",
  auth("CANDIDATE"),
  validate(antiCheatingEventSchema),
  AntiCheatingController.createEvent,
);

AttemptRouter.get(
  "/:id/anti-cheating-events",
  auth(),
  validate(attemptParamsSchema),
  AntiCheatingController.listEvents,
);

export const CandidateAttemptRouter = express.Router();

CandidateAttemptRouter.get(
  "/attempts",
  auth("CANDIDATE"),
  validate(candidatesAttemptsQuerySchema),
  AttemptController.candidatesMeAttempts,
);

export const startAttemptRouter = express.Router();

startAttemptRouter.post(
  "/:id/attempts/start",
  auth("CANDIDATE"),
  validate(assessmentParams),
  AttemptController.start,
);