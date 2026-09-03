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

export const EvaluationController = {
  evaluateWritten,
  listForAttempt,
};