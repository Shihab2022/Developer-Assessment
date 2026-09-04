import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { ResultServices } from "./results.service";
import { paginate } from "../../helpers/utils";

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ResultServices.getById(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Result retrieved successfully",
    data: result,
  });
});

const getSkillBreakdown = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ResultServices.getSkillBreakdown(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Skill breakdown retrieved successfully",
    data: result,
  });
});

const candidatesMeResults = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await ResultServices.candidatesMeResults(req.user!, page, limit);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "My results retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const listForAssessment = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await ResultServices.listForAssessment(
    req.user!,
    String(req.params.id),
    page,
    limit,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment results retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const ResultController = {
  getById,
  getSkillBreakdown,
  candidatesMeResults,
  listForAssessment,
};
