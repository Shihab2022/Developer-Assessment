import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpars/catchAsync";
import sendResponse from "../../helpars/sendResponse";
import { AuthServices } from "./auth.service";
import { IAuthUser } from "../../types";
import config from "../../config";

const register = catchAsync(async (req: Request, res: Response) => {
  const user = await AuthServices.register(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User registered successfully!",
    data: user,
  });
});
const login = catchAsync(async (req: Request, res: Response) => {
  const { accessToken, refreshToken } = await AuthServices.login(req.body);
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    // "none" requires secure: true. For local http, use "lax".
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    secure: config.NODE_ENV === "production", // Must be true when sameSite is "none"
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 day
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully!",
    data: { accessToken, refreshToken },
  });
});
const getMe = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await AuthServices.getMe(req.user!);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User details retrieved successfully!",
      data: result,
    });
  },
);
const updateMe = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await AuthServices.updateMe(req.user!, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User details updated successfully!",
      data: result,
    });
  },
);
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset email sent successfully!",
    data: result,
  });
});
const updatePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.updatePassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password updated successfully!",
    data: result,
  });
});
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  getMe,
  updateMe,
  forgetPassword,
  updatePassword,
  resetPassword,
};
