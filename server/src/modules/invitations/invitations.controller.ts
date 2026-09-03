import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { InvitationServices } from "./invitations.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

const createForAssessment = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const result = await InvitationServices.create(
      req.user!,
      String(req.params.id),
      req.body,
      getMeta(req),
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: "Invitations created successfully",
      data: result,
    });
  },
);

const listForAssessment = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = paginate(
      Number(req.query.page),
      Number(req.query.limit),
    );
    const result = await InvitationServices.listForAssessment(
      req.user!,
      String(req.params.id),
      {
        page,
        limit,
        status: req.query.status as string,
      },
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "Invitations retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

const resend = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InvitationServices.resend(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Invitation resent successfully",
    data: result,
  });
});

const accept = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InvitationServices.accept(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Invitation accepted successfully",
    data: result,
  });
});

const reject = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InvitationServices.reject(
    req.user!,
    String(req.params.id),
    getMeta(req),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Invitation rejected",
    data: result,
  });
});

const listForCandidate = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = paginate(
      Number(req.query.page),
      Number(req.query.limit),
    );
    const result = await InvitationServices.listForCandidate(req.user!, {
      page,
      limit,
      status: req.query.status as string,
    });
    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: "My invitations retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  },
);

export const InvitationController = {
  createForAssessment,
  listForAssessment,
  resend,
  accept,
  reject,
  listForCandidate,
};