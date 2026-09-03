import crypto from "crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { AssessmentServices } from "../assessments/assessments.service";
import { InvitationStatus } from "../../../generated/prisma/enums";

const generateInviteToken = () => crypto.randomBytes(24).toString("hex");

const create = async (
  user: IAuthUser,
  assessmentId: string,
  payload: { candidates: { email: string; expiresAt?: string }[] },
  meta: { ip?: string; userAgent?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await AssessmentServices.assertAssessmentAccess(user, assessment, true);

  const result = await prisma.$transaction(async (tx) => {
    const created: unknown[] = [];
    for (const candidate of payload.candidates) {
      const email = candidate.email.toLowerCase().trim();

      const existingInvite = await tx.invitation.findUnique({
        where: { assessmentId_email: { assessmentId, email } },
      });
      if (existingInvite) {
        throw new ApiError(
          httpStatus.CONFLICT,
          `Candidate ${email} is already invited to this assessment`,
        );
      }

      const candidateUser = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      const invite = await tx.invitation.create({
        data: {
          assessmentId,
          candidateId: candidateUser?.id ?? null,
          email,
          invitedBy: user.id,
          companyId: assessment.companyId,
          token: generateInviteToken(),
          expiresAt: candidate.expiresAt ? new Date(candidate.expiresAt) : null,
          status: InvitationStatus.PENDING,
        },
      });
      created.push(invite);
    }
    return created;
  });

  await writeAuditLog({
    actorId: user.id,
    action: "invitation.create",
    entityType: "Invitation",
    entityId: assessmentId,
    newValue: { count: payload.candidates.length },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return result;
};

const listForAssessment = async (
  user: IAuthUser,
  assessmentId: string,
  query: { page?: number; limit?: number; status?: string },
) => {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await AssessmentServices.assertAssessmentAccess(user, assessment);

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = { assessmentId };
  if (query.status) where.status = query.status;

  const [total, data] = await Promise.all([
    prisma.invitation.count({ where }),
    prisma.invitation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        candidate: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};
const resend = async (
  user: IAuthUser,
  invitationId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, "Invitation not found");

  const assessment = await prisma.assessment.findFirst({
    where: { id: invitation.assessmentId, deletedAt: null },
  });
  if (!assessment) throw new ApiError(httpStatus.NOT_FOUND, "Assessment not found");
  await AssessmentServices.assertAssessmentAccess(user, assessment, true);

  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.PENDING,
      token: generateInviteToken(),
      invitedAt: new Date(),
      expiresAt: null,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "invitation.resend",
    entityType: "Invitation",
    entityId: invitationId,
    newValue: { email: invitation.email },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

export const assertInvitationOwnership = (
  user: IAuthUser,
  invitation: { email: string; candidateId: string | null },
) => {
  const isOwner =
    user.email.toLowerCase() === invitation.email.toLowerCase() ||
    (invitation.candidateId !== null && invitation.candidateId === user.id);
  if (!isOwner) {
    throw new ApiError(httpStatus.FORBIDDEN, "This invitation does not belong to you");
  }
};

const accept = async (
  user: IAuthUser,
  invitationId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, "Invitation not found");
  assertInvitationOwnership(user, invitation);

  if (
    invitation.status === InvitationStatus.REJECTED ||
    invitation.status === InvitationStatus.COMPLETED
  ) {
    throw new ApiError(httpStatus.CONFLICT, "Invitation is no longer actionable");
  }
  if (invitation.status === InvitationStatus.EXPIRED) {
    throw new ApiError(httpStatus.CONFLICT, "Invitation has expired");
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw new ApiError(httpStatus.CONFLICT, "Invitation has expired");
  }

  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
      candidateId: user.id,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "invitation.accept",
    entityType: "Invitation",
    entityId: invitationId,
    newValue: { email: invitation.email },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const reject = async (
  user: IAuthUser,
  invitationId: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });
  if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, "Invitation not found");
  assertInvitationOwnership(user, invitation);

  if (
    invitation.status === InvitationStatus.COMPLETED ||
    invitation.status === InvitationStatus.REJECTED
  ) {
    throw new ApiError(httpStatus.CONFLICT, "Invitation is no longer actionable");
  }

  const updated = await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.REJECTED },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "invitation.reject",
    entityType: "Invitation",
    entityId: invitationId,
    newValue: { email: invitation.email },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return updated;
};

const listForCandidate = async (
  user: IAuthUser,
  query: { page?: number; limit?: number; status?: string },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const where: Record<string, unknown> = {
    OR: [
      { candidateId: user.id },
      { email: { equals: user.email, mode: "insensitive" } },
    ],
    assessment: { deletedAt: null },
  };
  if (query.status) where.status = query.status;

  const [total, data] = await Promise.all([
    prisma.invitation.count({ where }),
    prisma.invitation.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            durationMinutes: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    }),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const InvitationServices = {
  create,
  listForAssessment,
  resend,
  accept,
  reject,
  listForCandidate,
};
