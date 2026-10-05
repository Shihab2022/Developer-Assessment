import crypto from "crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { writeAuditLog } from "../../lib/audit";
import { buildInvitationEmail, isMailEnabled, sendMail } from "../../lib/mailer";
import { AssessmentServices } from "../assessments/assessments.service";
import { InvitationStatus } from "../../../generated/prisma/enums";

const generateInviteToken = () => crypto.randomBytes(24).toString("hex");

/** Emails the candidate their personal exam link (`/invitations/join?token=...`). */
const sendInvitationEmail = async (invitation: {
  assessmentId: string;
  email: string;
  token: string | null;
  expiresAt: Date | null;
  candidateId: string | null;
}) => {
  if (!isMailEnabled() || !invitation.token) return;
  const assessment = await prisma.assessment.findFirst({
    where: { id: invitation.assessmentId, deletedAt: null },
    include: {
      company: { select: { name: true } },
      creator: { select: { name: true, email: true } },
    },
  });
  if (!assessment) return;

  const candidate = invitation.candidateId
    ? await prisma.user.findUnique({
        where: { id: invitation.candidateId },
        select: { name: true },
      })
    : null;

  const joinUrl = `${config.frontend_url}/invitations/join?token=${invitation.token}`;
  const rendered = buildInvitationEmail({
    candidateName: candidate?.name ?? "",
    companyName: assessment.company?.name ?? "the hiring team",
    assessmentTitle: assessment.title,
    durationMinutes: assessment.durationMinutes,
    joinUrl,
    recruiterName: assessment.creator?.name,
    expiresAt: invitation.expiresAt,
  });

  await sendMail({
    to: invitation.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: assessment.creator?.email,
  });
};

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
    const skipped: string[] = [];
    for (const candidate of payload.candidates) {
      const email = candidate.email.toLowerCase().trim();

      // Bulk invites are forgiving: an address that is already invited is
      // reported back to the caller instead of failing every other invite.
      const existingInvite = await tx.invitation.findUnique({
        where: { assessmentId_email: { assessmentId, email } },
      });
      if (existingInvite) {
        skipped.push(email);
        continue;
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
    return { created, skipped };
  });

  await writeAuditLog({
    actorId: user.id,
    action: "invitation.create",
    entityType: "Invitation",
    entityId: assessmentId,
    newValue: {
      count: result.created.length,
      skipped: result.skipped.length,
    },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  // Deliver the personal exam link to each invited candidate.
  for (const invite of result.created as Array<{
    assessmentId: string;
    email: string;
    token: string | null;
    expiresAt: Date | null;
    candidateId: string | null;
  }>) {
    await sendInvitationEmail(invite);
  }

  return {
    invited: result.created.length,
    skipped: result.skipped.length,
    skippedEmails: result.skipped,
    invitations: result.created,
  };
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

  await sendInvitationEmail(updated);

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

/** Resolves a personal exam link. Public — used before the candidate signs in. */
const getByToken = async (token: string) => {
  const invitation = await prisma.invitation.findFirst({
    where: { token },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          description: true,
          instructions: true,
          durationMinutes: true,
          status: true,
          startDate: true,
          endDate: true,
          showResults: true,
          maxAttempts: true,
          company: { select: { id: true, name: true, logo: true } },
        },
      },
      candidate: { select: { id: true, name: true, email: true } },
    },
  });
  if (!invitation) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "This invitation link is invalid or has been revoked.",
    );
  }

  const expiredByDate = Boolean(invitation.expiresAt && invitation.expiresAt < new Date());
  const expired =
    expiredByDate ||
    invitation.status === InvitationStatus.EXPIRED ||
    (invitation.assessment.endDate !== null &&
      invitation.assessment.endDate < new Date());
  const closed =
    invitation.status === InvitationStatus.COMPLETED ||
    invitation.status === InvitationStatus.REJECTED;

  // Single-attempt guarantee: an exam is considered taken once ANY account with
  // the invited email has started an attempt for this assessment.
  const attemptsByEmail = await prisma.attempt.count({
    where: {
      assessmentId: invitation.assessmentId,
      candidate: { email: { equals: invitation.email, mode: "insensitive" } },
    },
  });
  const alreadyAttempted = attemptsByEmail > 0;

  const account = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true, name: true },
  });

  return {
    id: invitation.id,
    email: invitation.email,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    expired,
    closed,
    alreadyAttempted,
    accountExists: Boolean(account),
    candidate: invitation.candidate,
    assessment: invitation.assessment,
    usable: !expired && !closed && !alreadyAttempted,
  };
};

/** Accepts the invitation for the signed-in candidate (must match the invited email). */
const acceptByToken = async (
  user: IAuthUser,
  token: string,
  meta: { ip?: string; userAgent?: string },
) => {
  const invitation = await prisma.invitation.findFirst({ where: { token } });
  if (!invitation) {
    throw new ApiError(httpStatus.NOT_FOUND, "This invitation link is invalid.");
  }

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      `This invitation was sent to ${invitation.email}. Please sign in with that address.`,
    );
  }

  if (invitation.status === InvitationStatus.COMPLETED) {
    throw new ApiError(httpStatus.CONFLICT, "You have already completed this assessment.");
  }
  if (invitation.status === InvitationStatus.REJECTED) {
    throw new ApiError(httpStatus.CONFLICT, "This invitation is no longer active.");
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.EXPIRED },
    });
    throw new ApiError(httpStatus.CONFLICT, "This invitation has expired.");
  }

  const attemptsByEmail = await prisma.attempt.count({
    where: {
      assessmentId: invitation.assessmentId,
      candidate: { email: { equals: invitation.email, mode: "insensitive" } },
    },
  });
  if (attemptsByEmail > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "This assessment has already been started with this email address and cannot be taken again.",
    );
  }

  const updated = await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
      candidateId: user.id,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "invitation.acceptByToken",
    entityType: "Invitation",
    entityId: invitation.id,
    newValue: { email: invitation.email, assessmentId: invitation.assessmentId },
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });

  return { invitation: updated, assessmentId: invitation.assessmentId };
};

export const InvitationServices = {
  create,
  listForAssessment,
  resend,
  accept,
  reject,
  listForCandidate,
  getByToken,
  acceptByToken,
};
