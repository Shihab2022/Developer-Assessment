import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { EvaluationServices } from "./evaluations.service";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const evaluateWritten = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await EvaluationServices.evaluateWritten(
    req.user!,
    req.body,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Written answer evaluated successfully",
    data: result,
  });
});

const listForAttempt = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await EvaluationServices.listForAttempt(
    req.user!,
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Evaluations retrieved successfully",
    data: result,
  });
});

const listPending = catchAsync(async (req: AuthRequest, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const result = await EvaluationServices.listPending(req.user!, { page, limit });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Pending evaluations retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const EvaluationController = {
  evaluateWritten,
  listForAttempt,
  listPending,
};
