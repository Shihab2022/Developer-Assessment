import express from "express";
import { AnalyticsController } from "./analytics.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { analyticsParamsSchema } from "./analytics.validation";

export const assessmentAnalyticsRouter = express.Router({ mergeParams: true });

assessmentAnalyticsRouter.get(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(analyticsParamsSchema),
  AnalyticsController.getAnalytics,
);
