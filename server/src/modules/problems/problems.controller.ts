import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { ProblemServices } from "./problems.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ProblemServices.create(req.body, req.user!, getMeta(req));
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Problem created successfully",
    data: result,
  });
});

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(
    Number(req.query.page),
    Number(req.query.limit),
  );
  const result = await ProblemServices.list(req.user!, {
    page,
    limit,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
    q: req.query.q as string,
    type: req.query.type as string,
    difficulty: req.query.difficulty as string,
    category: req.query.category as string,
    status: req.query.status as string,
    tags: req.query.tags as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Problems retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ProblemServices.getById(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Problem retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ProblemServices.update(
    req.user!,
    String(req.params.id),
    req.body,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Problem updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await ProblemServices.remove(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Problem deleted successfully",
    data: result,
  });
});

const search = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(
    Number(req.query.page),
    Number(req.query.limit),
  );
  const result = await ProblemServices.search(
    req.user!,
    (req.query.q as string) ?? "",
    page,
    limit,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Search completed successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const ProblemController = {
  create,
  list,
  getById,
  update,
  remove,
  search,
};