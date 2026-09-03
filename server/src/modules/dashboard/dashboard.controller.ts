import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { DashboardServices } from "./dashboard.service";

const recruiterDashboard = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await DashboardServices.recruiterDashboard(req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, message: "Recruiter dashboard retrieved successfully", data: result });
});

const candidateDashboard = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await DashboardServices.candidateDashboard(req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, message: "Candidate dashboard retrieved successfully", data: result });
});

export const DashboardController = { recruiterDashboard, candidateDashboard };
