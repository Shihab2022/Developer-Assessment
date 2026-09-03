import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthServices } from "./auth.service";
import { AuthRequest } from "../../middlewares/auth";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.register(req.body, getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Account registered successfully",
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(req.body, getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Logged in successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.refreshToken(req.body.refreshToken, getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Tokens refreshed successfully",
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const token =
    req.body.refreshToken ?? (req.cookies?.refreshToken as string | undefined);
  await AuthServices.logout(token ?? "", getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AuthServices.getMe(req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};
