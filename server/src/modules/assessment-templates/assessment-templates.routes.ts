import express from "express";
import { AssessmentTemplateController } from "./assessment-templates.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createTemplateSchema, updateTemplateSchema, templateQuerySchema,
  templateParamsSchema, useTemplateSchema,
} from "./assessment-templates.validation";

const router = express.Router();

router.post("/", auth("RECRUITER", "ADMIN"), validate(createTemplateSchema), AssessmentTemplateController.create);
router.get("/", auth(), validate(templateQuerySchema), AssessmentTemplateController.list);
router.get("/:id", auth(), validate(templateParamsSchema), AssessmentTemplateController.getById);
router.patch("/:id", auth("RECRUITER", "ADMIN"), validate(templateParamsSchema), validate(updateTemplateSchema), AssessmentTemplateController.update);
router.delete("/:id", auth("RECRUITER", "ADMIN"), validate(templateParamsSchema), AssessmentTemplateController.remove);
router.post("/:id/use", auth("RECRUITER", "ADMIN"), validate(templateParamsSchema), validate(useTemplateSchema), AssessmentTemplateController.useTemplate);

export const AssessmentTemplateRouter = router;
