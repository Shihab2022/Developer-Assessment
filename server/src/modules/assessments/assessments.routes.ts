import express from "express";
import { AssessmentController } from "./assessments.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  assessmentParams,
  assessmentProblemListQuery,
  assessmentQuerySchema,
  createAssessmentSchema,
  updateAssessmentSchema,
} from "./assessments.validation";
import { assessmentInvitationRouter } from "../invitations/invitations.routes";
import { z } from "zod";

const assessmentProblemParams = assessmentParams.extend({
  params: assessmentParams.shape.params.extend({
    problemId: z.string().uuid("Invalid problem id"),
  }),
});

const addProblemSchema = z.object({
  body: z
    .object({
      problemId: z.string().uuid(),
      points: z.number().int().min(1).max(1000).optional(),
      isRequired: z.boolean().optional(),
      section: z.string().max(200).optional(),
      order: z.number().int().min(0).optional(),
    })
    .strict(),
});

const updateProblemSchema = z.object({
  body: z
    .object({
      points: z.number().int().min(1).max(1000).optional(),
      isRequired: z.boolean().optional(),
      section: z.string().max(200).optional().nullable(),
      order: z.number().int().min(0).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

const router = express.Router();

router.post(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(createAssessmentSchema),
  AssessmentController.create,
);

router.get("/", auth(), validate(assessmentQuerySchema), AssessmentController.list);

router.patch(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  validate(updateAssessmentSchema),
  AssessmentController.update,
);

router.delete(
  "/:id",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.remove,
);

router.post(
  "/:id/publish",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.publish,
);

router.post(
  "/:id/close",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.close,
);

router.post(
  "/:id/duplicate",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.duplicate,
);

router.post(
  "/:id/archive",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.archive,
);

router.post(
  "/:id/restore",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.restore,
);

router.post(
  "/:id/recalculate-results",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.recalculateResults,
);

router.get(
  "/:id/candidates/compare",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.compareCandidates,
);

router.get(
  "/:id/history",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  AssessmentController.history,
);

router.post(
  "/:id/problems",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentParams),
  validate(addProblemSchema),
  AssessmentController.addProblem,
);

router.get(
  "/:id/problems",
  auth(),
  validate(assessmentParams),
  validate(assessmentProblemListQuery),
  AssessmentController.listProblems,
);

router.patch(
  "/:id/problems/:problemId",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentProblemParams),
  validate(updateProblemSchema),
  AssessmentController.updateProblem,
);

router.delete(
  "/:id/problems/:problemId",
  auth("RECRUITER", "ADMIN"),
  validate(assessmentProblemParams),
  AssessmentController.removeProblem,
);

// NOTE: /:id must be registered AFTER specific sub-routes
router.use("/:id/invitations", validate(assessmentParams), assessmentInvitationRouter);

router.get("/:id", auth(), validate(assessmentParams), AssessmentController.getById);

export const AssessmentRouter = router;
