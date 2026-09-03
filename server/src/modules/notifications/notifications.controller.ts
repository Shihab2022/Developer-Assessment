import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { NotificationServices } from "./notifications.service";
import { paginate } from "../../helpers/utils";

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await NotificationServices.list(req.user!, { page, limit, status: req.query.status as string });
  sendResponse(res, { statusCode: httpStatus.OK, message: "Notifications retrieved successfully", meta: result.meta, data: result.data });
});

const markAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await NotificationServices.markAsRead(req.user!, String(req.params.id));
  sendResponse(res, { statusCode: httpStatus.OK, message: "Notification marked as read", data: result });
});

const markAllAsRead = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await NotificationServices.markAllAsRead(req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, message: "All notifications marked as read", data: result });
});

const getUnreadCount = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await NotificationServices.getUnreadCount(req.user!);
  sendResponse(res, { statusCode: httpStatus.OK, message: "Unread count retrieved", data: result });
});

export const NotificationController = { list, markAsRead, markAllAsRead, getUnreadCount };
