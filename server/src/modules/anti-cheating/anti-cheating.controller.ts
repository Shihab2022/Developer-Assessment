import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { AntiCheatingService } from "./anti-cheating.service";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const createEvent = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AntiCheatingService.createEvent(
    req.user!,
    String(req.params.id),
    req.body,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Anti-cheating event recorded",
    data: result,
  });
});

const listEvents = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AntiCheatingService.listEvents(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Anti-cheating events retrieved successfully",
    data: result,
  });
});

export const AntiCheatingController = {
  createEvent,
  listEvents,
};
