import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { AssessmentServices } from "./assessments.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.create(
    req.body,
    req.user!,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Assessment created successfully",
    data: result,
  });
});

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AssessmentServices.list(req.user!, {
    page,
    limit,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
    q: req.query.q as string,
    status: req.query.status as string,
    companyId: req.query.companyId as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.getById(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.update(
    req.user!,
    String(req.params.id),
    req.body,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.remove(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment deleted successfully",
    data: result,
  });
});

const publish = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.publish(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment published successfully",
    data: result,
  });
});

const close = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.close(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment closed successfully",
    data: result,
  });
});

const history = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.getHistory(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment history retrieved successfully",
    data: result,
  });
});

const addProblem = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.addProblem(
    req.user!,
    String(req.params.id),
    req.body,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Problem added to assessment",
    data: result,
  });
});

const listProblems = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.listProblems(
    req.user!,
    String(req.params.id),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment problems retrieved successfully",
    data: result,
  });
});

const updateProblem = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.updateProblem(
    req.user!,
    String(req.params.id),
    String(req.params.problemId),
    req.body,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessment problem updated successfully",
    data: result,
  });
});

const removeProblem = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AssessmentServices.removeProblem(
    req.user!,
    String(req.params.id),
    String(req.params.problemId),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Problem removed from assessment",
    data: result,
  });
});

export const AssessmentController = {
  create,
  list,
  getById,
  update,
  remove,
  publish,
  close,
  history,
  addProblem,
  listProblems,
  updateProblem,
  removeProblem,
};