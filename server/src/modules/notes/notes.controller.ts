import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { NoteServices } from "./notes.service";
import { paginate } from "../../helpers/utils";

const getMeta = (req: Request) => ({ ip: req.ip ?? req.socket.remoteAddress ?? undefined, userAgent: req.headers["user-agent"] ?? undefined });

const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await NoteServices.create(req.user!, req.body, getMeta(req));
  sendResponse(res, { statusCode: httpStatus.CREATED, message: "Note created successfully", data: result });
});

const update = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await NoteServices.update(req.user!, String(req.params.noteId), req.body, getMeta(req));
  sendResponse(res, { statusCode: httpStatus.OK, message: "Note updated successfully", data: result });
});

const remove = catchAsync(async (req: AuthRequest, res: Response) => {
  await NoteServices.remove(req.user!, String(req.params.noteId), getMeta(req));
  sendResponse(res, { statusCode: httpStatus.OK, message: "Note deleted successfully", data: null });
});

const listForCandidate = catchAsync(async (req: AuthRequest, res: Response) => {
  const { page, limit } = paginate(Number(req.query.page), Number(req.query.limit));
  const result = await NoteServices.listForCandidate(req.user!, String(req.params.candidateId), { page, limit, assessmentId: req.query.assessmentId as string });
  sendResponse(res, { statusCode: httpStatus.OK, message: "Notes retrieved successfully", meta: result.meta, data: result.data });
});

export const NoteController = { create, update, remove, listForCandidate };
