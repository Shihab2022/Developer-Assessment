const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
  console.log('Created:', filePath);
}

// ============ Assessment Templates Module ============

// Controller
writeFile('server/src/modules/assessment-templates/assessment-templates.controller.ts', `import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { AssessmentTemplateServices } from "./assessment-templates.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentTemplateServices.create(req.body, req.user!, getMeta(req));
  sendResponse(res, { statusCode: httpStatus.CREATED, message: "Assessment template created successfully", data: result });
});

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AssessmentTemplateServices.list(req.user!, {
    page, limit, q: req.query.q as string, status: req.query.status as string, companyId: req.query.companyId as string,
  });
  sendResponse(res, { statusCode: httpStatus.OK, message: "Assessment templates retrieved successfully", meta: result.meta, data: result.data });
});

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentTemplateServices.getById(req.user!, String(req.params.id));
  sendResponse(res, { statusCode: httpStatus.OK, message: "Assessment template retrieved successfully", data: result });
});

const update = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentTemplateServices.update(req.user!, String(req.params.id), req.body, getMeta(req));
  sendResponse(res, { statusCode: httpStatus.OK, message: "Assessment template updated successfully", data: result });
});

const remove = catchAsync(async (req: AuthRequest, res: Response) => {
  await AssessmentTemplateServices.remove(req.user!, String(req.params.id), getMeta(req));
  sendResponse(res, { statusCode: httpStatus.OK, message: "Assessment template deleted successfully", data: null });
});

const useTemplate = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentTemplateServices.useTemplate(req.user!, String(req.params.id), req.body, getMeta(req));
  sendResponse(res, { statusCode: httpStatus.CREATED, message: "Assessment created from template successfully", data: result });
});

export const AssessmentTemplateController = { create, list, getById, update, remove, useTemplate };
`);

// Validation
writeFile('server/src/modules/assessment-templates/assessment-templates.validation.ts', `import { z } from "zod";

export const createTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300),
    description: z.string().max(3000).optional(),
    durationMinutes: z.number().int().min(5).max(1440),
    passingScore: z.number().int().min(0).optional(),
    maxAttempts: z.number().int().min(1).max(10).optional(),
    shuffleProblems: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    showResults: z.boolean().optional(),
    antiCheatingEnabled: z.boolean().optional(),
    resultStrategy: z.enum(["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"]).optional(),
    accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"]).optional(),
    questionConfig: z.any().optional(),
    skills: z.array(z.string()).optional(),
    difficultyDistribution: z.any().optional(),
    antiCheatingSettings: z.any().optional(),
    companyId: z.string().uuid().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  }).strict(),
});

export const updateTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300).optional(),
    description: z.string().max(3000).optional().nullable(),
    durationMinutes: z.number().int().min(5).max(1440).optional(),
    passingScore: z.number().int().min(0).optional(),
    maxAttempts: z.number().int().min(1).max(10).optional(),
    shuffleProblems: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    showResults: z.boolean().optional(),
    antiCheatingEnabled: z.boolean().optional(),
    resultStrategy: z.enum(["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"]).optional(),
    accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"]).optional(),
    questionConfig: z.any().optional(),
    skills: z.array(z.string()).optional(),
    difficultyDistribution: z.any().optional(),
    antiCheatingSettings: z.any().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" }),
});

export const templateQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    q: z.string().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
    companyId: z.string().uuid().optional(),
  }).strict(),
});

export const templateParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid template id") }),
});

export const useTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300).optional(),
    companyId: z.string().uuid().optional(),
  }).strict(),
});
`);

// Routes
writeFile('server/src/modules/assessment-templates/assessment-templates.routes.ts', `import express from "express";
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
`);

console.log('Assessment Templates module created');
