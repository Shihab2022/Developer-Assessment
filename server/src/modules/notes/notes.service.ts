import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";

const assertCandidateAccess = async (user: IAuthUser, candidateId: string) => {
  if (user.role === "ADMIN") return;
  if (user.role === "RECRUITER") {
    const candidate = await prisma.user.findUnique({ where: { id: candidateId } });
    if (candidate === null) throw new ApiError(httpStatus.NOT_FOUND, "Candidate not found");
    return;
  }
  if (user.id !== candidateId) throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
};

const create = async (user: IAuthUser, payload: { candidateId: string; assessmentId?: string; companyId?: string; content: string; isPrivate?: boolean }, meta: { ip?: string; userAgent?: string }) => {
  await assertCandidateAccess(user, payload.candidateId);
  const note = await prisma.candidateNote.create({
    data: {
      candidateId: payload.candidateId,
      assessmentId: payload.assessmentId ?? null,
      companyId: payload.companyId ?? (user.role === "RECRUITER" ? user.companyId : null),
      authorId: user.id,
      content: payload.content,
      isPrivate: payload.isPrivate ?? false,
    },
    include: { author: { select: { id: true, name: true } } },
  });
  await writeAuditLog({ actorId: user.id, action: "note.create", entityType: "CandidateNote", entityId: note.id, newValue: { candidateId: payload.candidateId }, ipAddress: meta.ip, userAgent: meta.userAgent });
  return note;
};

const update = async (user: IAuthUser, noteId: string, payload: { content?: string; isPrivate?: boolean }, meta: { ip?: string; userAgent?: string }) => {
  const note = await prisma.candidateNote.findFirst({ where: { id: noteId, deletedAt: null } });
  if (note === null) throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
  if (note.authorId !== user.id && user.role !== "ADMIN") throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
  const data: Record<string, unknown> = {};
  if (payload.content !== undefined) data.content = payload.content;
  if (payload.isPrivate !== undefined) data.isPrivate = payload.isPrivate;
  const updated = await prisma.candidateNote.update({ where: { id: noteId }, data });
  await writeAuditLog({ actorId: user.id, action: "note.update", entityType: "CandidateNote", entityId: noteId, newValue: data, ipAddress: meta.ip, userAgent: meta.userAgent });
  return updated;
};

const remove = async (user: IAuthUser, noteId: string, meta: { ip?: string; userAgent?: string }) => {
  const note = await prisma.candidateNote.findFirst({ where: { id: noteId, deletedAt: null } });
  if (note === null) throw new ApiError(httpStatus.NOT_FOUND, "Note not found");
  if (note.authorId !== user.id && user.role !== "ADMIN") throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
  await prisma.candidateNote.update({ where: { id: noteId }, data: { deletedAt: new Date() } });
  await writeAuditLog({ actorId: user.id, action: "note.delete", entityType: "CandidateNote", entityId: noteId, ipAddress: meta.ip, userAgent: meta.userAgent });
  return null;
};

const listForCandidate = async (user: IAuthUser, candidateId: string, query: { assessmentId?: string; page?: number; limit?: number }) => {
  await assertCandidateAccess(user, candidateId);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = { candidateId, deletedAt: null };
  if (query.assessmentId) where.assessmentId = query.assessmentId;
  if (user.role === "RECRUITER") where.OR = [{ isPrivate: false }, { authorId: user.id }];
  else if (user.role === "CANDIDATE") where.authorId = user.id;
  const [total, data] = await Promise.all([
    prisma.candidateNote.count({ where }),
    prisma.candidateNote.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, name: true } }, assessment: { select: { id: true, title: true } } } }),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

export const NoteServices = { create, update, remove, listForCandidate };
