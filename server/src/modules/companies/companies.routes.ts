import express from "express";
import { CompanyController } from "./companies.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createCompanySchema,
  idParamSchema,
  updateCompanySchema,
} from "./companies.validation";
import { getAllQuerySchema } from "../../helpers/zodSchemas";

const router = express.Router();

router.post(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(createCompanySchema),
  CompanyController.create,
);

router.get("/", auth(), validate(getAllQuerySchema), CompanyController.list);

router.get(
  "/:id",
  auth(),
  validate(idParamSchema),
  CompanyController.getById,
);

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

export const CompanyRouter = router;