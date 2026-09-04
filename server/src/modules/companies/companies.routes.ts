import express from "express";
import { CompanyController } from "./companies.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createCompanySchema,
  idParamSchema,
  updateCompanySchema,
} from "./companies.validation";
import { z } from "zod";
import { getAllQuerySchema } from "../../helpers/zodSchemas";

const candidateStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid candidate invitation id") }),
  body: z.object({
    recruitmentStatus: z.enum([
      "INVITED",
      "STARTED",
      "COMPLETED",
      "SHORTLISTED",
      "INTERVIEW",
      "HIRED",
      "REJECTED",
    ]),
  }).strict(),
});

const router = express.Router();

router.post(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(createCompanySchema),
  CompanyController.create,
);

router.get("/", auth(), validate(getAllQuerySchema), CompanyController.list);

router.get("/:id", auth(), validate(idParamSchema), CompanyController.getById);

router.patch(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(idParamSchema),
  validate(updateCompanySchema),
  CompanyController.update,
);

router.delete(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(idParamSchema),
  CompanyController.remove,
);

router.get(
  "/:id/members",
  auth(),
  validate(idParamSchema),
  CompanyController.getMembers,
);

router.get(
  "/:id/analytics",
  auth("RECRUITER", "ADMIN"),
  validate(idParamSchema),
  CompanyController.companyAnalytics,
);

router.get(
  "/:companyId/candidates",
  auth("RECRUITER", "ADMIN"),
  CompanyController.listCandidates,
);

router.patch(
  "/candidates/:id/status",
  auth("RECRUITER", "ADMIN"),
  validate(candidateStatusSchema),
  CompanyController.updateCandidateStatus,
);

export const CompanyRouter = router;
