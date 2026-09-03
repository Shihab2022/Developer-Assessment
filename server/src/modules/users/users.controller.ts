import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { UserServices } from "./users.service";

const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await UserServices.updateMe(req.user!, {});
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await UserServices.updateMe(req.user!, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Profile updated successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: AuthRequest, res: Response) => {
  await UserServices.changePassword(req.user!, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Password changed successfully",
    data: null,
  });
});

const activity = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await UserServices.getActivity(req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Activity retrieved successfully",
    data: result,
  });
});

export const UserController = {
  getMe,
  updateMe,
  changePassword,
  activity,
};