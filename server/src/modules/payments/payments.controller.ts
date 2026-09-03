import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { PaymentServices } from "./payments.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const initiate = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await PaymentServices.initiate(req.user!, req.body, getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Payment initiated successfully",
    data: result,
  });
});

const success = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  const result = await PaymentServices.handleSuccess(payload as never);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payment completed successfully",
    data: result,
  });
});

const fail = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  const result = await PaymentServices.handleFail(payload as never);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payment failed",
    data: result,
  });
});

const cancel = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  const result = await PaymentServices.handleCancel(payload as never);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payment cancelled",
    data: result,
  });
});

const ipn = catchAsync(async (req: Request, res: Response) => {
  const payload = { ...req.body, ...req.query };
  const result = await PaymentServices.handleIpn(payload as never);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "IPN processed successfully",
    data: result,
  });
});

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await PaymentServices.getById(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payment retrieved successfully",
    data: result,
  });
});

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await PaymentServices.list(req.user!, {
    page,
    limit,
    status: req.query.status as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Payments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const listPackages = catchAsync(async (_req: Request, res: Response) => {
  const result = await PaymentServices.listPackages();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Packages retrieved successfully",
    data: result,
  });
});

export const PaymentController = {
  initiate,
  success,
  fail,
  cancel,
  ipn,
  getById,
  list,
  listPackages,
};
