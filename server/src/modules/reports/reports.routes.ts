import express from "express";
import { ReportController } from "./reports.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  assessmentReportParamsSchema,
  companyReportParamsSchema,
} from "./reports.validation";

// Assessment-scoped: GET /assessments/:id/report
export const assessmentReportRouter = express.Router();

assessmentReportRouter.get(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentReportParamsSchema),
  ReportController.assessmentReport,
);

// Company-scoped: GET /companies/:id/reports
export const companyReportRouter = express.Router();

companyReportRouter.get(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(companyReportParamsSchema),
  ReportController.listForCompany,
);

companyReportRouter.get(
  "/summary",
  auth("RECRUITER", "ADMIN"),
  validate(companyReportParamsSchema),
  ReportController.companyReport,
);