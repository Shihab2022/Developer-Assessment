import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { SubmissionServices } from "./submissions.service";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await SubmissionServices.create(
    req.user!,
    req.body,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Submission created successfully",
    data: result,
  });
});

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await SubmissionServices.getById(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Submission retrieved successfully",
    data: result,
  });
});

const listForAttempt = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await SubmissionServices.listForAttempt(
    req.user!,
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Submissions retrieved successfully",
    data: result,
  });
});

const evaluate = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await SubmissionServices.evaluate(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Submission evaluated successfully",
    data: result,
  });
});

export const SubmissionController = {
  create,
  getById,
  listForAttempt,
  evaluate,
};