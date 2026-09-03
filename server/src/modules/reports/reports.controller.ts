import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { ReportServices } from "./reports.service";
import { paginate } from "../../helpers/utils";

const assessmentReport = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ReportServices.generateAssessmentReport(
    req.user!,
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment report generated successfully",
    data: result,
  });
});

const companyReport = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ReportServices.generateCompanyReport(
    req.user!,
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Company report generated successfully",
    data: result,
  });
});

const listForCompany = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await ReportServices.listForCompany(
    req.user!,
    String(req.params.id),
    page,
    limit,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Company reports retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const ReportController = {
  assessmentReport,
  companyReport,
  listForCompany,
};