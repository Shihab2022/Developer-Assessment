import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { AnalyticsServices } from "./analytics.service";

const getAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AnalyticsServices.getAnalytics(
    req.user!,
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Analytics retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getAnalytics,
};