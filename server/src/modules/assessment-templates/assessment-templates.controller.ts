import { Request, Response } from "express";
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
