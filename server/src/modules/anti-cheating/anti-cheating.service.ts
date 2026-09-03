import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { IAuthUser } from "../../types";
import { AttemptServices } from "../attempts/attempts.service";
import { AntiCheatingEventType } from "../../../generated/prisma/enums";

const createEvent = async (
  user: IAuthUser,
  attemptId: string,
  payload: { eventType: AntiCheatingEventType; metadata?: unknown },
  meta: { ip?: string; userAgent?: string },
) => {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) throw new ApiError(httpStatus.NOT_FOUND, "Attempt not found");
  if (attempt.candidateId !== user.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only report events for your own attempts",
    );
  }

  const event = await prisma.antiCheatingEvent.create({
    data: {
      attemptId,
      eventType: payload.eventType,
      metadata: (payload.metadata as never) ?? null,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      timestamp: new Date(),
    },
  });
  return event;
};

const listEvents = async (user: IAuthUser, attemptId: string) => {
  const attempt = await AttemptServices.assertAttemptOwnership(user, attemptId);
  void attempt;
  const events = await prisma.antiCheatingEvent.findMany({
    where: { attemptId },
    orderBy: { timestamp: "asc" },
  });
  return events;
};

export const AntiCheatingService = {
  createEvent,
  listEvents,
};