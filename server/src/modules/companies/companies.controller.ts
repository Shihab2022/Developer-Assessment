import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { CompanyServices } from "./companies.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await CompanyServices.create(req.body, req.user!, getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Company created successfully",
    data: result,
  });
});

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(
    Number(req.query.page),
    Number(req.query.limit),
  );
  const q = req.query.q as string | undefined;
  const result = await CompanyServices.list(q, page, limit);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Companies retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await CompanyServices.getById(String(req.params.id), req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Company retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await CompanyServices.update(
    String(req.params.id),
    req.body,
    req.user!,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Company updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await CompanyServices.remove(
    String(req.params.id),
    req.user!,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Company deleted successfully",
    data: result,
  });
});

const getMembers = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await CompanyServices.getMembers(String(req.params.id), req.user!);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Company members retrieved successfully",
    data: result,
  });
});

export const CompanyController = {
  create,
  list,
  getById,
  update,
  remove,
  getMembers,
};