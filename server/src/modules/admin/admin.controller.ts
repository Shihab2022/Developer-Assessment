import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { AdminServices } from "./admin.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const listUsers = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AdminServices.listUsers({
    page,
    limit,
    q: req.query.q as string,
    role: req.query.role as string,
    status: req.query.status as string,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AdminServices.getUserById(String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User retrieved successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AdminServices.updateUserStatus(
    req.user!,
    String(req.params.id),
    req.body.status,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User status updated successfully",
    data: result,
  });
});

const updateUserRole = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await AdminServices.updateUserRole(
    req.user!,
    String(req.params.id),
    req.body.role,
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "User role updated successfully",
    data: result,
  });
});

const listCompanies = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AdminServices.listCompanies({
    page,
    limit,
    q: req.query.q as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Companies retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const listAssessments = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AdminServices.listAssessments({
    page,
    limit,
    q: req.query.q as string,
    status: req.query.status as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Assessments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const listPayments = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AdminServices.listPayments({
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

const dashboardStats = catchAsync(async (_req: AuthRequest, res: Response) => {
  const result = await AdminServices.dashboardStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Dashboard statistics retrieved successfully",
    data: result,
  });
});

const listAuditLogs = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AdminServices.listAuditLogs({
    page,
    limit,
    action: req.query.action as string,
    entityType: req.query.entityType as string,
    actorId: req.query.actorId as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Audit logs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const listProblems = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await AdminServices.listProblems({
    page,
    limit,
    q: req.query.q as string,
    type: req.query.type as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Problems retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const AdminController = {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  listCompanies,
  listAssessments,
  listPayments,
  dashboardStats,
  listAuditLogs,
  listProblems,
};