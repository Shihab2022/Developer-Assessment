import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { AttemptServices } from "./attempts.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const start = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AttemptServices.start(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Attempt started successfully",
    data: result,
  });
});

const getAttempt = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AttemptServices.getAttempt(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Attempt retrieved successfully",
    data: result,
  });
});

const getQuestions = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AttemptServices.getQuestions(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Questions retrieved successfully",
    data: result,
  });
});

const saveAnswer = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AttemptServices.saveAnswer(
    req.user!,
    String(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Answer saved successfully",
    data: result,
  });
});

const updateAnswer = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AttemptServices.updateAnswer(
    req.user!,
    String(req.params.id),
    String(req.params.answerId),
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Answer updated successfully",
    data: result,
  });
});

const submit = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AttemptServices.submit(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: result.alreadySubmitted
      ? "Attempt was already submitted"
      : "Attempt submitted successfully",
    data: result,
  });
});

const candidatesMeAttempts = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AttemptServices.candidatesMeAttempts(req.user!, {
    page,
    limit,
    status: req.query.status as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "My attempts retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const AttemptController = {
  start,
  getAttempt,
  getQuestions,
  saveAnswer,
  updateAnswer,
  submit,
  candidatesMeAttempts,
};
