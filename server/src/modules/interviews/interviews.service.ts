import crypto from "crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import ApiError from "../../helpers/ApiError";
import { writeAuditLog } from "../../lib/audit";
import config from "../../config";
import { IAuthUser } from "../../types";
import {
  DEFAULT_QUESTION_COUNT,
  DEFAULT_QUESTION_TIME_SECONDS,
  getInterviewTopic,
  isSupportedTechnology,
  listInterviewTopics,
  pickBankQuestions,
  type BankQuestion,
} from "../../data/interview-bank";
import {
  buildInterviewInviteEmail,
  buildInterviewVerificationEmail,
  isMailEnabled,
  sendMail,
} from "../../lib/mailer";
import {
  reviewAnswer,
  reviewSession,
  type SessionReviewAnswer,
} from "../../lib/aiInterview";
import {
  InterviewDecision,
  InterviewStatus,
  InterviewViolationSeverity,
  InterviewViolationType,
} from "../../../generated/prisma/enums";

/* ------------------------------------------------------------------ constants */

/**
 * Proctoring policy. The server is the source of truth: the browser can *report*
 * a signal but never chooses the severity or whether a session is terminated
 * (requirements 8, 9 and 10).
 */
const VIOLATION_SEVERITY: Record<InterviewViolationType, InterviewViolationSeverity> = {
  DEVICE_DETECTED: InterviewViolationSeverity.CRITICAL,
  MULTIPLE_FACES: InterviewViolationSeverity.CRITICAL,
  NOISE_DETECTED: InterviewViolationSeverity.CRITICAL,
  TAB_SWITCH: InterviewViolationSeverity.CRITICAL,
  FULLSCREEN_EXIT: InterviewViolationSeverity.CRITICAL,
  CAMERA_BLOCKED: InterviewViolationSeverity.HIGH,
  MICROPHONE_BLOCKED: InterviewViolationSeverity.HIGH,
  FACE_NOT_VISIBLE: InterviewViolationSeverity.HIGH,
  WINDOW_BLUR: InterviewViolationSeverity.MEDIUM,
  LOOKING_AWAY: InterviewViolationSeverity.MEDIUM,
  COPY: InterviewViolationSeverity.LOW,
  PASTE: InterviewViolationSeverity.LOW,
};

/** Integrity deduction per severity (out of 100). */
const INTEGRITY_PENALTY: Record<InterviewViolationSeverity, number> = {
  CRITICAL: 100,
  HIGH: 20,
  MEDIUM: 8,
  LOW: 2,
};

const HUMAN_VIOLATION_LABEL: Record<InterviewViolationType, string> = {
  DEVICE_DETECTED: "A second device (phone / second screen) was visible on camera",
  MULTIPLE_FACES: "More than one person was detected in the camera frame",
  NOISE_DETECTED: "Excessive background noise / third-party voices were detected",
  TAB_SWITCH: "The candidate switched away from the interview tab",
  FULLSCREEN_EXIT: "The candidate left full-screen mode",
  CAMERA_BLOCKED: "The camera feed was blocked or unavailable",
  MICROPHONE_BLOCKED: "The microphone was blocked or silent",
  FACE_NOT_VISIBLE: "The candidate's face left the camera frame",
  WINDOW_BLUR: "The interview window lost focus",
  LOOKING_AWAY: "The candidate repeatedly looked away from the screen",
  COPY: "Text was copied from the interview page",
  PASTE: "Text was pasted into the interview page",
};

const LINK_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
/** How long an emailed email-ownership code stays valid. */
const VERIFICATION_CODE_TTL_MS = 1000 * 60 * 15; // 15 minutes

/* -------------------------------------------------------------------- helpers */

const newToken = () => crypto.randomBytes(24).toString("base64url");

/** Six-digit, zero-padded email verification code. */
const newVerificationCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
const hashVerificationCode = (code: string) =>
  crypto.createHash("sha256").update(code).digest("hex");

const serializeSettings = (body: Record<string, unknown>) => {
  const settings: Record<string, unknown> = {};
  if (body.showScoreToCandidate !== undefined) {
    settings.showScoreToCandidate = body.showScoreToCandidate;
  }
  return settings;
};

const questionTimeFor = (
  interview: { questionTimeSeconds: number },
  question: { timeSeconds?: number | null },
) => question.timeSeconds ?? interview.questionTimeSeconds;

/** Recruiter/admin access check for one interview. */
const assertInterviewAccess = async (user: IAuthUser, interviewId: string) => {
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, deletedAt: null },
  });
  if (!interview) throw new ApiError(httpStatus.NOT_FOUND, "Interview not found");
  if (user.role === "ADMIN") return interview;
  if (
    interview.createdBy === user.id ||
    (interview.companyId && interview.companyId === user.companyId)
  ) {
    return interview;
  }
  throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this interview");
};

const bankQuestionData = (question: BankQuestion, order: number, maxScore = 10) => ({
  order,
  prompt: question.prompt,
  hints: question.hints,
  expectedKeywords: question.keywords,
  modelAnswer: question.model,
  maxScore,
  source: "BANK" as const,
  bankKey: question.key,
  difficulty: question.difficulty,
  topic: question.topic,
});

/* --------------------------------------------------------- bank & reference */

const listTechnologies = () => ({
  technologies: listInterviewTopics(),
  defaults: {
    questionCount: DEFAULT_QUESTION_COUNT,
    questionTimeSeconds: DEFAULT_QUESTION_TIME_SECONDS,
  },
});

/* --------------------------------------------------------- recruiter: create */

const createInterview = async (
  user: IAuthUser,
  body: {
    title: string;
    description?: string;
    jobRole?: string;
    technology: string;
    seniority: string;
    questionCount: number;
    questionTimeSeconds: number;
    totalTimeSeconds?: number | null;
    shuffleQuestions: boolean;
    hintsEnabled: boolean;
    proctoringEnabled: boolean;
    terminateOnCritical: boolean;
    aiReviewEnabled: boolean;
    passScore: number;
    maxViolations: number;
    startsAt: string;
    expiresAt: string;
    showScoreToCandidate: boolean;
    useBankQuestions: boolean;
    customQuestions: {
      prompt: string;
      hints: string[];
      expectedKeywords: string[];
      modelAnswer?: string;
      timeSeconds?: number | null;
      maxScore: number;
      topic?: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
    }[];
    companyId?: string;
  },
) => {
  if (!isSupportedTechnology(body.technology)) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      `No interview question bank for "${body.technology}". Available technologies: ${listInterviewTopics()
        .map((topic) => topic.id)
        .join(", ")}`,
    );
  }

  const companyId = user.role === "ADMIN" ? (body.companyId ?? user.companyId) : user.companyId;
  const bankQuestions = body.useBankQuestions
    ? pickBankQuestions(body.technology, body.questionCount)
    : [];

  if (!bankQuestions.length && !body.customQuestions.length) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Provide at least one question: enable the question bank or add custom questions",
    );
  }

  const interview = await prisma.interview.create({
    data: {
      companyId: companyId ?? null,
      createdBy: user.id,
      title: body.title,
      description: body.description ?? null,
      jobRole: body.jobRole ?? null,
      technology: body.technology.trim().toLowerCase(),
      seniority: body.seniority,
      questionCount: bankQuestions.length + body.customQuestions.length || body.questionCount,
      questionTimeSeconds: body.questionTimeSeconds,
      totalTimeSeconds: body.totalTimeSeconds ?? null,
      shuffleQuestions: body.shuffleQuestions,
      hintsEnabled: body.hintsEnabled,
      proctoringEnabled: body.proctoringEnabled,
      terminateOnCritical: body.terminateOnCritical,
      aiReviewEnabled: body.aiReviewEnabled,
      passScore: body.passScore,
      maxViolations: body.maxViolations,
      accessToken: newToken(),
      status: InterviewStatus.DRAFT,
      startsAt: new Date(body.startsAt),
      expiresAt: new Date(body.expiresAt),
      settings: serializeSettings(body) as never,
      questions: {
        create: [
          ...bankQuestions.map((question, index) => bankQuestionData(question, index + 1)),
          ...body.customQuestions.map((question, index) => ({
            order: bankQuestions.length + index + 1,
            prompt: question.prompt,
            hints: question.hints,
            expectedKeywords: question.expectedKeywords,
            modelAnswer: question.modelAnswer ?? null,
            timeSeconds: question.timeSeconds ?? null,
            maxScore: question.maxScore,
            source: "CUSTOM" as const,
            difficulty: question.difficulty,
            topic: question.topic ?? null,
          })),
        ],
      },
    },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "interview.create",
    entityType: "Interview",
    entityId: interview.id,
    newValue: { title: interview.title, technology: interview.technology },
  });

  return interview;
};


/* ----------------------------------------------------------- recruiter: read */

const listInterviews = async (
  user: IAuthUser,
  query: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    technology?: string;
    companyId?: string;
  },
) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  const where: Record<string, unknown> = { deletedAt: null };
  if (user.role !== "ADMIN") {
    where.OR = [{ companyId: user.companyId ?? "__none__" }, { createdBy: user.id }];
  } else if (query.companyId) {
    where.companyId = query.companyId;
  }
  if (query.status) where.status = query.status;
  if (query.technology) where.technology = query.technology.toLowerCase();
  if (query.q) {
    where.AND = [
      {
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { jobRole: { contains: query.q, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.interview.count({ where }),
    prisma.interview.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { questions: true, sessions: true } },
      },
    }),
  ]);

  const data = rows.map(({ _count, ...interview }) => ({
    ...interview,
    questionTotal: _count.questions,
    sessionTotal: _count.sessions,
    candidateLink: `${config.interview.link_base_url}/interview/${interview.accessToken}`,
  }));

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const getInterview = async (user: IAuthUser, interviewId: string) => {
  const interview = await assertInterviewAccess(user, interviewId);
  const [questions, sessionTotal, reviewedTotal, terminatedTotal] = await Promise.all([
    prisma.interviewQuestion.findMany({ where: { interviewId }, orderBy: { order: "asc" } }),
    prisma.interviewSession.count({ where: { interviewId } }),
    prisma.interviewSession.count({ where: { interviewId, status: "REVIEWED" } }),
    prisma.interviewSession.count({ where: { interviewId, status: "TERMINATED" } }),
  ]);

  return {
    ...interview,
    candidateLink: `${config.interview.link_base_url}/interview/${interview.accessToken}`,
    questions,
    stats: { sessionTotal, reviewedTotal, terminatedTotal },
  };
};

/* --------------------------------------------------------- recruiter: update */

const updateInterview = async (
  user: IAuthUser,
  interviewId: string,
  body: Record<string, unknown>,
) => {
  const interview = await assertInterviewAccess(user, interviewId);

  const data: Record<string, unknown> = {};
  const copyable = [
    "title",
    "description",
    "jobRole",
    "technology",
    "seniority",
    "questionCount",
    "questionTimeSeconds",
    "totalTimeSeconds",
    "shuffleQuestions",
    "hintsEnabled",
    "proctoringEnabled",
    "terminateOnCritical",
    "aiReviewEnabled",
    "passScore",
    "maxViolations",
    "status",
  ];
  for (const key of copyable) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (typeof data.technology === "string") {
    if (!isSupportedTechnology(data.technology)) {
      throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, "Unsupported technology");
    }
    data.technology = data.technology.toLowerCase();
  }
  if (body.startsAt !== undefined) {
    data.startsAt = body.startsAt ? new Date(body.startsAt as string) : null;
  }
  if (body.expiresAt !== undefined) {
    data.expiresAt = body.expiresAt ? new Date(body.expiresAt as string) : null;
  }
  // Guard the active window when either end is being changed (requirement 7).
  const nextStartsAt = (data.startsAt ?? interview.startsAt) as Date | null;
  const nextExpiresAt = (data.expiresAt ?? interview.expiresAt) as Date | null;
  if (nextStartsAt && nextExpiresAt && nextExpiresAt.getTime() <= nextStartsAt.getTime()) {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "The exam close time must be after the link activation time",
    );
  }
  if (body.showScoreToCandidate !== undefined) {
    const settings = (interview.settings as Record<string, unknown> | null) ?? {};
    data.settings = { ...settings, showScoreToCandidate: body.showScoreToCandidate };
  }
  if (!Object.keys(data).length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No updatable fields provided");
  }

  const updated = await prisma.interview.update({
    where: { id: interviewId },
    data: data as never,
  });
  await writeAuditLog({
    actorId: user.id,
    action: "interview.update",
    entityType: "Interview",
    entityId: interviewId,
    previousValue: { status: interview.status, questionTimeSeconds: interview.questionTimeSeconds },
    newValue: data,
  });
  return updated;
};

const deleteInterview = async (user: IAuthUser, interviewId: string) => {
  await assertInterviewAccess(user, interviewId);
  await prisma.interview.update({
    where: { id: interviewId },
    data: { deletedAt: new Date(), status: InterviewStatus.ARCHIVED },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "interview.delete",
    entityType: "Interview",
    entityId: interviewId,
  });
  return { id: interviewId, deleted: true };
};

const setStatus = async (
  user: IAuthUser,
  interviewId: string,
  status: InterviewStatus,
  action: string,
) => {
  await assertInterviewAccess(user, interviewId);
  const updated = await prisma.interview.update({
    where: { id: interviewId },
    data: { status },
  });
  await writeAuditLog({
    actorId: user.id,
    action: `interview.${action}`,
    entityType: "Interview",
    entityId: interviewId,
    newValue: { status },
  });
  return {
    ...updated,
    candidateLink: `${config.interview.link_base_url}/interview/${updated.accessToken}`,
  };
};

/* ------------------------------------------------------ recruiter: questions */

const regenerateQuestions = async (
  user: IAuthUser,
  interviewId: string,
  body: { questionCount?: number; keepCustomQuestions: boolean },
) => {
  const interview = await assertInterviewAccess(user, interviewId);
  const count = body.questionCount ?? interview.questionCount;

  const existing = await prisma.interviewQuestion.findMany({
    where: { interviewId },
    orderBy: { order: "asc" },
  });
  const custom = existing.filter((question) => question.source === "CUSTOM");
  const keptCustom = body.keepCustomQuestions ? custom : [];

  // Bank questions are replaced with a fresh random sample from the technology.
  // `count` is the interview's question budget, so the organisation's own
  // questions are subtracted from the number of bank questions drawn.
  await prisma.interviewQuestion.deleteMany({ where: { interviewId, source: "BANK" } });
  const bankCount = Math.max(1, count - keptCustom.length);
  const bankQuestions = pickBankQuestions(interview.technology, bankCount);

  await prisma.interviewQuestion.createMany({
    data: bankQuestions.map((question, index) => ({
      interviewId,
      ...bankQuestionData(question, index + 1),
    })),
  });

  // Kept custom questions are re-ordered in place (never re-created) so their
  // ids stay stable and any answers already recorded against them survive.
  await Promise.all(
    keptCustom.map((question, index) =>
      prisma.interviewQuestion.update({
        where: { id: question.id },
        data: { order: bankQuestions.length + index + 1 },
      }),
    ),
  );
  if (!body.keepCustomQuestions && custom.length) {
    await prisma.interviewQuestion.deleteMany({
      where: { interviewId, id: { in: custom.map((question) => question.id) } },
    });
  }

  await prisma.interview.update({
    where: { id: interviewId },
    data: { questionCount: bankQuestions.length + keptCustom.length },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "interview.regenerate-questions",
    entityType: "Interview",
    entityId: interviewId,
    newValue: { bankQuestions: bankQuestions.length, customQuestions: keptCustom.length },
  });

  return prisma.interviewQuestion.findMany({ where: { interviewId }, orderBy: { order: "asc" } });
};

const addCustomQuestion = async (
  user: IAuthUser,
  interviewId: string,
  body: {
    prompt: string;
    hints: string[];
    expectedKeywords: string[];
    modelAnswer?: string;
    timeSeconds?: number | null;
    maxScore: number;
    topic?: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  },
) => {
  await assertInterviewAccess(user, interviewId);
  const last = await prisma.interviewQuestion.findFirst({
    where: { interviewId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const question = await prisma.interviewQuestion.create({
    data: {
      interviewId,
      order: (last?.order ?? 0) + 1,
      prompt: body.prompt,
      hints: body.hints,
      expectedKeywords: body.expectedKeywords,
      modelAnswer: body.modelAnswer ?? null,
      timeSeconds: body.timeSeconds ?? null,
      maxScore: body.maxScore,
      source: "CUSTOM",
      difficulty: body.difficulty,
      topic: body.topic ?? null,
    },
  });

  await prisma.interview.update({
    where: { id: interviewId },
    data: { questionCount: { increment: 1 } },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "interview.question.create",
    entityType: "InterviewQuestion",
    entityId: question.id,
    newValue: { interviewId, prompt: body.prompt },
  });
  return question;
};

const updateQuestion = async (
  user: IAuthUser,
  interviewId: string,
  questionId: string,
  body: Record<string, unknown>,
) => {
  await assertInterviewAccess(user, interviewId);
  const question = await prisma.interviewQuestion.findFirst({
    where: { id: questionId, interviewId },
  });
  if (!question) throw new ApiError(httpStatus.NOT_FOUND, "Question not found");

  const data: Record<string, unknown> = {};
  for (const key of [
    "prompt",
    "hints",
    "expectedKeywords",
    "modelAnswer",
    "timeSeconds",
    "maxScore",
    "topic",
    "difficulty",
    "order",
  ]) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (!Object.keys(data).length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No updatable fields provided");
  }
  return prisma.interviewQuestion.update({ where: { id: questionId }, data: data as never });
};

const deleteQuestion = async (user: IAuthUser, interviewId: string, questionId: string) => {
  await assertInterviewAccess(user, interviewId);
  const question = await prisma.interviewQuestion.findFirst({
    where: { id: questionId, interviewId },
  });
  if (!question) throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
  await prisma.interviewQuestion.delete({ where: { id: questionId } });
  await prisma.interview.update({
    where: { id: interviewId },
    data: { questionCount: { decrement: 1 } },
  });
  return { id: questionId, deleted: true };
};

/* --------------------------------------------------- recruiter: session link */

const createSessionLink = async (
  user: IAuthUser,
  interviewId: string,
  body: { candidateName: string; candidateEmail: string },
) => {
  const interview = await assertInterviewAccess(user, interviewId);
  const email = body.candidateEmail.toLowerCase();

  const existing = await prisma.interviewSession.findFirst({
    where: { interviewId, candidateEmail: email, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
  });
  if (existing) {
    return {
      session: existing,
      link: `${config.interview.link_base_url}/interview/${existing.token}`,
      reused: true,
    };
  }

  const candidate = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  const session = await prisma.interviewSession.create({
    data: {
      interviewId,
      candidateId: candidate?.id ?? null,
      token: newToken(),
      candidateName: body.candidateName,
      candidateEmail: email,
      expiresAt: new Date(Date.now() + LINK_TTL_MS),
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "interview.session.invite",
    entityType: "InterviewSession",
    entityId: session.id,
    newValue: { interviewId: interview.id, candidateEmail: email },
  });

  return {
    session,
    link: `${config.interview.link_base_url}/interview/${session.token}`,
    reused: false,
  };
};

/* ------------------------------------------------ recruiter: invite candidates */

/** Masks an email for display: `ab***@example.com`. */
const maskEmail = (email: string) => {
  const [name = "", domain] = email.split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 1))}@${domain}`;
};

/** Searches existing platform users (e.g. candidates who sat other exams). */
const searchInvitableCandidates = async (
  _user: IAuthUser,
  query: { q?: string; limit?: number },
) => {
  const limit = Math.min(Math.max(Number(query.limit) || 12, 1), 50);
  const where: Record<string, unknown> = { deletedAt: null, role: "CANDIDATE" };
  if (query.q && query.q.trim()) {
    const q = query.q.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }
  const candidates = await prisma.user.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { attempts: true, interviewSessions: true } },
    },
  });
  return candidates.map(({ _count, ...candidate }) => ({
    ...candidate,
    examsTaken: _count.attempts + _count.interviewSessions,
  }));
};

/** Builds + sends the personal, secured interview link. Never throws. */
const sendInterviewInviteEmail = async (
  session: { id: string; token: string; candidateName: string; candidateEmail: string },
  interview: {
    id: string;
    title: string;
    jobRole: string | null;
    companyId: string | null;
    questionCount: number;
    questionTimeSeconds: number;
    totalTimeSeconds: number | null;
    startsAt: Date | null;
    expiresAt: Date | null;
  },
  actor: IAuthUser,
) => {
  if (!isMailEnabled()) return false;
  const [company, creator] = await Promise.all([
    interview.companyId
      ? prisma.company.findUnique({ where: { id: interview.companyId }, select: { name: true } })
      : Promise.resolve(null),
    prisma.user.findUnique({ where: { id: actor.id }, select: { name: true, email: true } }),
  ]);
  const candidateUrl = `${config.interview.link_base_url}/interview/${session.token}`;
  const durationMinutes = Math.max(
    1,
    Math.round(
      (interview.totalTimeSeconds ?? interview.questionCount * interview.questionTimeSeconds) / 60,
    ),
  );
  const rendered = buildInterviewInviteEmail({
    candidateName: session.candidateName,
    companyName: company?.name ?? "the hiring team",
    interviewTitle: interview.title,
    jobRole: interview.jobRole,
    durationMinutes,
    candidateUrl,
    recruiterName: creator?.name,
    opensAt: interview.startsAt,
    expiresAt: interview.expiresAt,
  });
  const sent = await sendMail({
    to: session.candidateEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: creator?.email,
  });
  if (sent) {
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { emailSentAt: new Date() },
    });
  }
  return sent;
};

/** Invites one or more candidates (by email) and emails each a secured link. */
const inviteCandidates = async (
  user: IAuthUser,
  interviewId: string,
  body: { candidates: { email: string; name?: string; sendEmail?: boolean }[] },
) => {
  const interview = await assertInterviewAccess(user, interviewId);
  const results: {
    sessionId: string;
    token: string;
    email: string;
    name: string;
    link: string;
    emailed: boolean;
    reused: boolean;
  }[] = [];

  for (const candidate of body.candidates) {
    const email = candidate.email.toLowerCase().trim();
    let reused = true;
    let session = await prisma.interviewSession.findFirst({
      where: { interviewId, candidateEmail: email, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
    });

    if (!session) {
      reused = false;
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, name: true },
      });
      session = await prisma.interviewSession.create({
        data: {
          interviewId,
          candidateId: existingUser?.id ?? null,
          token: newToken(),
          candidateName:
            candidate.name?.trim() || existingUser?.name || email.split("@")[0] || "Candidate",
          candidateEmail: email,
          expiresAt: interview.expiresAt ?? new Date(Date.now() + LINK_TTL_MS),
        },
      });
    }

    const link = `${config.interview.link_base_url}/interview/${session.token}`;
    const emailed =
      candidate.sendEmail === false ? false : await sendInterviewInviteEmail(session, interview, user);

    await writeAuditLog({
      actorId: user.id,
      action: "interview.session.invite",
      entityType: "InterviewSession",
      entityId: session.id,
      newValue: { interviewId, candidateEmail: email, emailed, reused },
    });

    results.push({
      sessionId: session.id,
      token: session.token,
      email,
      name: session.candidateName,
      link,
      emailed,
      reused,
    });
  }

  return {
    invited: results.length,
    emailed: results.filter((row) => row.emailed).length,
    results,
  };
};

/** Re-sends the invitation email for an existing candidate session. */
const resendInvite = async (user: IAuthUser, interviewId: string, sessionId: string) => {
  const interview = await assertInterviewAccess(user, interviewId);
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, interviewId },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "Candidate session not found");

  const emailed = await sendInterviewInviteEmail(session, interview, user);
  if (!emailed) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Email is not configured — copy the candidate link and share it directly",
    );
  }
  return { sessionId, email: session.candidateEmail, emailed: true, sentAt: new Date() };
};

/* ------------------------------------------------- recruiter: bank questions */

/** Lists the built-in bank questions for a technology so the org can cherry-pick. */
const listBankQuestions = (technology: string, q?: string) => {
  const topic = getInterviewTopic(technology);
  if (!topic) {
    throw new ApiError(httpStatus.NOT_FOUND, `No interview question bank for "${technology}"`);
  }
  const needle = q?.trim().toLowerCase();
  const questions = topic.questions
    .filter(
      (question) =>
        !needle ||
        question.prompt.toLowerCase().includes(needle) ||
        question.topic.toLowerCase().includes(needle) ||
        question.key.toLowerCase().includes(needle),
    )
    .map((question) => ({
      key: question.key,
      topic: question.topic,
      difficulty: question.difficulty,
      prompt: question.prompt,
      hints: question.hints,
      keywords: question.keywords,
    }));
  return { technology: topic.id, label: topic.label, total: topic.questions.length, questions };
};

/** Adds selected bank questions to an interview (requirement 6). */
const addBankQuestions = async (user: IAuthUser, interviewId: string, keys: string[]) => {
  const interview = await assertInterviewAccess(user, interviewId);
  const topic = getInterviewTopic(interview.technology);
  if (!topic) {
    throw new ApiError(httpStatus.UNPROCESSABLE_ENTITY, "This interview has no question bank");
  }
  const bankByKey = new Map(topic.questions.map((question) => [question.key, question]));
  const existing = await prisma.interviewQuestion.findMany({
    where: { interviewId },
    orderBy: { order: "desc" },
    select: { order: true, bankKey: true, source: true },
  });
  let order = existing[0]?.order ?? 0;
  const alreadyAdded = new Set(
    existing.filter((q) => q.source === "BANK" && q.bankKey).map((q) => q.bankKey as string),
  );

  const toAdd: Record<string, unknown>[] = [];
  for (const key of keys) {
    if (alreadyAdded.has(key)) continue;
    const bank = bankByKey.get(key);
    if (!bank) continue;
    order += 1;
    toAdd.push({ interviewId, ...bankQuestionData(bank, order) });
  }
  if (!toAdd.length) {
    throw new ApiError(httpStatus.CONFLICT, "Those questions are already part of this interview");
  }

  await prisma.interviewQuestion.createMany({ data: toAdd as never });
  await prisma.interview.update({
    where: { id: interviewId },
    data: { questionCount: { increment: toAdd.length } },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "interview.question.add-from-bank",
    entityType: "Interview",
    entityId: interviewId,
    newValue: { added: toAdd.length, keys },
  });
  return prisma.interviewQuestion.findMany({ where: { interviewId }, orderBy: { order: "asc" } });
};

/* ------------------------------------------------------------- public helpers */

const riskLevelFor = (integrityScore: number) =>
  integrityScore <= 40 ? "HIGH" : integrityScore <= 75 ? "MEDIUM" : "LOW";

const showScoreToCandidate = (settings: unknown) => {
  const value = (settings as Record<string, unknown> | null)?.showScoreToCandidate;
  return value === undefined ? true : Boolean(value);
};

/** Notifies every recruiter of the owning company that a report is ready. */
const notifyCompany = async (
  interview: { id: string; title: string; companyId: string | null; createdBy: string },
  payload: { sessionId: string; title: string; message: string; terminated: boolean },
) => {
  try {
    const recipients = new Set<string>([interview.createdBy]);
    if (interview.companyId) {
      const [members, users] = await Promise.all([
        prisma.companyMember.findMany({
          where: { companyId: interview.companyId },
          select: { userId: true },
        }),
        prisma.user.findMany({
          where: { companyId: interview.companyId, status: "ACTIVE" },
          select: { id: true },
        }),
      ]);
      members.forEach((member) => recipients.add(member.userId));
      users.forEach((user) => recipients.add(user.id));
    }
    if (!recipients.size) return;
    await prisma.notification.createMany({
      data: [...recipients].map((userId) => ({
        userId,
        type: "RESULT_AVAILABLE" as const,
        title: payload.title,
        message: payload.message,
        data: {
          interviewId: interview.id,
          interviewTitle: interview.title,
          sessionId: payload.sessionId,
          terminated: payload.terminated,
        } as never,
      })),
    });
  } catch {
    // Notifications must never fail the interview flow.
  }
};

/** Resolves a public link: a per-candidate session token or the shared interview token. */
const resolveLink = async (token: string) => {
  const session = await prisma.interviewSession.findUnique({
    where: { token },
    include: { interview: true },
  });
  if (session) return { session, interview: session.interview, mode: "session" as const };

  const interview = await prisma.interview.findUnique({ where: { accessToken: token } });
  if (interview && !interview.deletedAt) {
    return { session: null, interview, mode: "interview" as const };
  }
  throw new ApiError(httpStatus.NOT_FOUND, "This interview link is not valid");
};

const assertInterviewOpen = (interview: {
  status: string;
  deletedAt: Date | null;
  startsAt: Date | null;
  expiresAt: Date | null;
}) => {
  if (interview.deletedAt || interview.status === "ARCHIVED" || interview.status === "CLOSED") {
    throw new ApiError(httpStatus.CONFLICT, "This interview is no longer accepting candidates");
  }
  if (interview.status === "DRAFT") {
    throw new ApiError(httpStatus.CONFLICT, "This interview has not been published yet");
  }
  if (interview.startsAt && interview.startsAt > new Date()) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `This interview link is not active yet. It opens on ${interview.startsAt.toUTCString()}`,
    );
  }
  if (interview.expiresAt && interview.expiresAt < new Date()) {
    throw new ApiError(httpStatus.CONFLICT, "This interview link has expired");
  }
};

const publicInterviewPayload = (interview: {
  id: string;
  title: string;
  description: string | null;
  jobRole: string | null;
  technology: string;
  seniority: string;
  questionTimeSeconds: number;
  totalTimeSeconds: number | null;
  hintsEnabled: boolean;
  proctoringEnabled: boolean;
  passScore: number;
  companyId: string | null;
  startsAt: Date | null;
  expiresAt: Date | null;
}) => ({
  id: interview.id,
  title: interview.title,
  description: interview.description,
  jobRole: interview.jobRole,
  technology: interview.technology,
  seniority: interview.seniority,
  questionTimeSeconds: interview.questionTimeSeconds,
  totalTimeSeconds: interview.totalTimeSeconds,
  hintsEnabled: interview.hintsEnabled,
  passScore: interview.passScore,
  startsAt: interview.startsAt,
  expiresAt: interview.expiresAt,
});

/** Pre-flight info: what the candidate is about to take, and the proctoring rules. */
const getPublicInterview = async (token: string) => {
  const { session, interview, mode } = await resolveLink(token);
  assertInterviewOpen(interview);

  const [company, questionTotal] = await Promise.all([
    interview.companyId
      ? prisma.company.findUnique({
          where: { id: interview.companyId },
          select: { name: true, logo: true },
        })
      : Promise.resolve(null),
    prisma.interviewQuestion.count({ where: { interviewId: interview.id } }),
  ]);

  return {
    mode,
    interview: { ...publicInterviewPayload(interview), company },
    questionTotal,
    requiresIdentity: mode === "interview",
    /** A personal invite link is bound to one email address (link security). */
    requiresEmailVerification: mode === "session" && !session?.emailVerifiedAt,
    emailVerified: mode === "interview" || Boolean(session?.emailVerifiedAt),
    invitedEmail: session?.candidateEmail ?? null,
    session: session
      ? {
          token: session.token,
          candidateName: session.candidateName,
          candidateEmail: session.candidateEmail,
          status: session.status,
          startedAt: session.startedAt,
          expiresAt: session.expiresAt,
          terminationReason: session.terminationReason,
        }
      : null,
    policy: {
      proctoringEnabled: interview.proctoringEnabled,
      terminateOnCritical: interview.terminateOnCritical,
      // Shown on the consent screen; mirrors the server-side policy.
      microphoneRequired: true,
      cameraRequired: true,
      fullscreenRequired: interview.proctoringEnabled,
      rules: [
        "The camera and microphone must stay on for the whole interview.",
        "Leaving full-screen, switching tabs or windows ends the interview immediately.",
        "A second device, a second person or loud background voices on camera end the interview.",
        "A terminated interview is suspended and scored 0.",
      ],
    },
  };
};

/* ------------------------------------------- public: email verification (link security) */

/**
 * Emails a one-time code to the invited address so the candidate can prove the
 * personal link belongs to them (requirement 5). Only the owner of the invited
 * mailbox can read the code, so only they can start the interview.
 */
const requestVerificationCode = async (token: string) => {
  const { session, interview, mode } = await resolveLink(token);
  assertInterviewOpen(interview);
  if (mode !== "session" || !session) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This link does not require email verification");
  }
  if (session.emailVerifiedAt) {
    return {
      sent: true,
      alreadyVerified: true,
      email: maskEmail(session.candidateEmail),
      expiresInMinutes: 0,
    };
  }

  const code = newVerificationCode();
  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      verificationCodeHash: hashVerificationCode(code),
      verificationCodeExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
    },
  });

  const expiresInMinutes = Math.round(VERIFICATION_CODE_TTL_MS / 60000);
  let sent = false;
  if (isMailEnabled()) {
    const company = interview.companyId
      ? await prisma.company.findUnique({
          where: { id: interview.companyId },
          select: { name: true },
        })
      : null;
    const rendered = buildInterviewVerificationEmail({
      candidateName: session.candidateName,
      companyName: company?.name ?? "the hiring team",
      interviewTitle: interview.title,
      code,
      expiresInMinutes,
    });
    sent = await sendMail({
      to: session.candidateEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  return {
    sent,
    alreadyVerified: false,
    email: maskEmail(session.candidateEmail),
    expiresInMinutes,
    // With no SMTP configured we return the code so local development still works.
    ...(sent ? {} : { devCode: code }),
  };
};

/** Confirms the one-time code and binds the session to the invited email owner. */
const confirmVerificationCode = async (token: string, code: string) => {
  const { session, interview, mode } = await resolveLink(token);
  assertInterviewOpen(interview);
  if (mode !== "session" || !session) {
    throw new ApiError(httpStatus.BAD_REQUEST, "This link does not require email verification");
  }
  if (session.emailVerifiedAt) {
    return { verified: true, email: session.candidateEmail };
  }
  if (
    !session.verificationCodeHash ||
    !session.verificationCodeExpiresAt ||
    session.verificationCodeExpiresAt < new Date()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "That code has expired — request a new one");
  }
  if (hashVerificationCode(code) !== session.verificationCodeHash) {
    throw new ApiError(httpStatus.BAD_REQUEST, "That code is not correct");
  }

  await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      emailVerifiedAt: new Date(),
      verificationCodeHash: null,
      verificationCodeExpiresAt: null,
    },
  });
  await writeAuditLog({
    actorId: session.candidateId ?? undefined,
    action: "interview.session.email-verified",
    entityType: "InterviewSession",
    entityId: session.id,
    newValue: { email: session.candidateEmail },
  });
  return { verified: true, email: session.candidateEmail };
};

/* -------------------------------------------------------------- public: start */

/**
 * Starts (or resumes) a candidate session.
 *
 * `token` may be the shared interview link or a per-candidate session token.
 * Consent, IP, user-agent and device info are captured here — the browser then
 * requests camera/microphone permission based on the returned policy.
 */
const startSession = async (
  token: string,
  body: {
    candidateName?: string;
    candidateEmail?: string;
    consentGiven: true;
    deviceInfo?: Record<string, unknown>;
  },
  meta: { ip?: string; userAgent?: string },
  currentUser?: IAuthUser,
) => {
  const resolved = await resolveLink(token);
  const interview = resolved.interview;
  assertInterviewOpen(interview);

  // A personal invite link only works for the email address it was sent to:
  // the candidate must have proved ownership of that address first (link security).
  if (resolved.mode === "session" && resolved.session && !resolved.session.emailVerifiedAt) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Verify the email address this invitation was sent to before starting the interview",
    );
  }

  let session = resolved.session;
  if (!session) {
    const email = body.candidateEmail?.toLowerCase();
    if (!body.candidateName || !email) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Your name and email are required to start this interview",
      );
    }
    const candidate =
      currentUser ??
      (await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, name: true, email: true, role: true, companyId: true },
      }));
    session = await prisma.interviewSession.create({
      data: {
        interviewId: interview.id,
        candidateId: candidate?.id ?? null,
        token: newToken(),
        candidateName: body.candidateName,
        candidateEmail: email,
        expiresAt: new Date(Date.now() + LINK_TTL_MS),
      },
      include: { interview: true },
    });
  }

  if (!session) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Unable to start the interview session");
  }
  if (session.status === "REVIEWED") {
    throw new ApiError(httpStatus.CONFLICT, "This interview has already been submitted");
  }
  if (session.status === "TERMINATED") {
    throw new ApiError(
      httpStatus.CONFLICT,
      session.terminationReason ?? "This interview session was terminated by proctoring",
    );
  }
  if (session.expiresAt && session.expiresAt < new Date()) {
    throw new ApiError(httpStatus.CONFLICT, "This interview link has expired");
  }

  const now = new Date();
  const ttlMs = config.interview.session_ttl_hours * 60 * 60 * 1000;
  const questions = await prisma.interviewQuestion.findMany({
    where: { interviewId: interview.id },
    orderBy: { order: "asc" },
  });
  if (!questions.length) {
    throw new ApiError(httpStatus.CONFLICT, "This interview has no questions configured");
  }

  // Serve the questions in a per-candidate order when shuffling is enabled.
  const served = interview.shuffleQuestions ? shuffleList(questions) : questions;
  const totalSeconds =
    interview.totalTimeSeconds ?? served.length * interview.questionTimeSeconds;

  // Pre-create one answer row per question so the report and totals stay stable.
  const sessionId = session.id;
  await prisma.interviewAnswer.createMany({
    data: served.map((question, index) => ({
      sessionId,
      questionId: question.id,
      order: index + 1,
      maxScore: question.maxScore,
      status: "PENDING",
    })),
    skipDuplicates: true,
  });

  session = await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: "IN_PROGRESS",
      startedAt: session.startedAt ?? now,
      consentGivenAt: now,
      ipAddress: meta.ip ?? session.ipAddress,
      userAgent: meta.userAgent ?? session.userAgent,
      deviceInfo: (body.deviceInfo as never) ?? undefined,
      expiresAt: new Date(Math.min(session.expiresAt?.getTime() ?? Infinity, now.getTime() + ttlMs)),
    },
    include: { interview: true },
  });

  const answers = await prisma.interviewAnswer.findMany({ where: { sessionId: session.id } });

  return {
    session: {
      token: session.token,
      status: session.status,
      candidateName: session.candidateName,
      candidateEmail: session.candidateEmail,
      startedAt: session.startedAt,
      deadline: new Date((session.startedAt ?? now).getTime() + totalSeconds * 1000),
      totalSeconds,
    },
    interview: publicInterviewPayload(interview),
    questions: served.map((question, index) => ({
      id: question.id,
      order: index + 1,
      topic: question.topic,
      difficulty: question.difficulty,
      source: question.source,
      prompt: question.prompt,
      hints: interview.hintsEnabled ? question.hints : [],
      timeSeconds: questionTimeFor(interview, question),
      maxScore: question.maxScore,
      /** Answers already uploaded for this question (resume support). */
      answer: answers.find((answer) => answer.questionId === question.id) ?? null,
    })),
    policy: {
      proctoringEnabled: interview.proctoringEnabled,
      terminateOnCritical: interview.terminateOnCritical,
      maxViolations: interview.maxViolations,
      hintsEnabled: interview.hintsEnabled,
    },
  };
};

/* ---------------------------------------------------------- public: proctoring */

const sessionStatePayload = (session: {
  token: string;
  status: string;
  violationCount: number;
  integrityScore: number;
  riskLevel: string;
  terminationReason: string | null;
}) => ({
  token: session.token,
  status: session.status,
  violationCount: session.violationCount,
  integrityScore: session.integrityScore,
  riskLevel: session.riskLevel,
  terminationReason: session.terminationReason,
});

/**
 * Records a proctoring signal and terminates the session when the policy says so
 * (requirements 8, 9 and 10). The browser reports raw signals; severity, integrity
 * and termination are decided here.
 */
const reportViolation = async (
  token: string,
  body: {
    type: InterviewViolationType;
    questionId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
    snapshot?: string;
  },
) => {
  const session = await prisma.interviewSession.findUnique({
    where: { token },
    include: { interview: true, violations: true },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "This interview link is not valid");

  if (!session.interview.proctoringEnabled) {
    return {
      terminated: false,
      ignored: true,
      reason: "Proctoring is disabled for this interview",
      ...sessionStatePayload(session),
    };
  }
  if (session.status === "TERMINATED" || session.status === "REVIEWED") {
    return {
      terminated: session.status === "TERMINATED",
      ignored: true,
      reason: "The interview session is already closed",
      ...sessionStatePayload(session),
    };
  }

  const severity = VIOLATION_SEVERITY[body.type];
  const description = body.description ?? HUMAN_VIOLATION_LABEL[body.type];

  await prisma.interviewViolation.create({
    data: {
      sessionId: session.id,
      questionId: body.questionId ?? null,
      type: body.type,
      severity,
      detectedBy: "CLIENT",
      description,
      metadata: (body.metadata as never) ?? null,
      snapshot: body.snapshot ?? null,
      occurredAt: new Date(),
    },
  });

  const violations = [...session.violations, { severity, type: body.type }];
  const penalty = violations.reduce(
    (total, violation) => total + INTEGRITY_PENALTY[violation.severity],
    0,
  );
  const integrityScore = Math.max(0, 100 - penalty);
  const riskLevel = riskLevelFor(integrityScore);
  const criticalCount = violations.filter(
    (violation) => violation.severity === InterviewViolationSeverity.CRITICAL,
  ).length;
  const softCount = violations.length - criticalCount;

  const mustTerminate =
    session.interview.terminateOnCritical &&
    (criticalCount > 0 || softCount > session.interview.maxViolations);

  if (!mustTerminate) {
    const updated = await prisma.interviewSession.update({
      where: { id: session.id },
      data: { violationCount: violations.length, integrityScore, riskLevel },
    });
    return { terminated: false, severity, description, ...sessionStatePayload(updated) };
  }

  const reason = `${description}. The interview was ended automatically and the session was suspended with a score of 0.`;
  const updated = await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: "TERMINATED",
      terminatedAt: new Date(),
      terminationReason: reason,
      violationCount: violations.length,
      integrityScore,
      riskLevel,
      // Requirement 8/9/10: a terminated viva scores zero.
      totalScore: 0,
      percentage: 0,
      passesInterview: false,
      decision: InterviewDecision.NO_HIRE,
      reviewProvider: "rubric",
      aiSummary: `Session terminated by proctoring: ${description}. Final score 0/${session.maxScore} as required by the anti-cheating policy.`,
      aiStrengths: [],
      aiImprovements: ["Interview terminated by proctoring — candidate suspended with 0 marks."],
    },
  });

  await notifyCompany(session.interview, {
    sessionId: session.id,
    title: "Interview terminated by proctoring",
    message: `${session.candidateName} (${session.candidateEmail}) was suspended with 0 marks: ${description}`,
    terminated: true,
  });
  await writeAuditLog({
    actorId: session.candidateId,
    action: "interview.session.terminated",
    entityType: "InterviewSession",
    entityId: session.id,
    newValue: { type: body.type, severity },
  });

  return {
    terminated: true,
    severity,
    description,
    reason,
    ...sessionStatePayload(updated),
  };
};

/** Current proctoring state — polled by the runner to stop the exam immediately. */
const getSessionState = async (token: string) => {
  const session = await prisma.interviewSession.findUnique({
    where: { token },
    select: {
      token: true,
      status: true,
      violationCount: true,
      integrityScore: true,
      riskLevel: true,
      terminationReason: true,
      startedAt: true,
    },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "This interview link is not valid");
  return sessionStatePayload(session);
};

/** Local shuffle helper (keeps the service free of extra imports). */
function shuffleList<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}


/* -------------------------------------------------------- public: save answer */

/** Stores one recorded answer (transcript + proctoring telemetry + evidence). */
const saveAnswer = async (
  token: string,
  questionId: string,
  body: {
    transcript?: string;
    recordingUrl?: string;
    recordingMime?: string;
    recordingSeconds?: number;
    audioLevelAvg?: number;
    videoFrames?: Record<string, unknown>;
    snapshots?: string[];
    hintsUsed: number;
    hintsRevealed: string[];
    timeSpentSeconds: number;
    startedAt?: string;
    status: "SUBMITTED" | "SKIPPED" | "IN_PROGRESS";
  },
) => {
  const session = await prisma.interviewSession.findUnique({
    where: { token },
    include: { interview: true },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "This interview link is not valid");

  if (session.status === "TERMINATED") {
    throw new ApiError(
      httpStatus.CONFLICT,
      session.terminationReason ?? "This interview session was terminated by proctoring",
    );
  }
  if (session.status !== "IN_PROGRESS") {
    throw new ApiError(
      httpStatus.CONFLICT,
      `The interview session is not accepting answers (status: ${session.status})`,
    );
  }

  const question = await prisma.interviewQuestion.findFirst({
    where: { id: questionId, interviewId: session.interviewId },
  });
  if (!question) throw new ApiError(httpStatus.NOT_FOUND, "Question not found in this interview");

  const existing = await prisma.interviewAnswer.findUnique({
    where: { sessionId_questionId: { sessionId: session.id, questionId } },
  });

  const data = {
    transcript: body.transcript ?? "",
    recordingUrl: body.recordingUrl ?? null,
    recordingMime: body.recordingMime ?? null,
    recordingSeconds: body.recordingSeconds ?? null,
    audioLevelAvg: body.audioLevelAvg ?? null,
    videoFrames: (body.videoFrames as never) ?? null,
    snapshots: (body.snapshots as never) ?? null,
    hintsUsed: body.hintsUsed,
    hintsRevealed: body.hintsRevealed,
    timeSpentSeconds: body.timeSpentSeconds,
    status: body.status,
    startedAt: existing?.startedAt ?? (body.startedAt ? new Date(body.startedAt) : new Date()),
    submittedAt: body.status === "SUBMITTED" ? new Date() : null,
  };

  const answer = await prisma.interviewAnswer.upsert({
    where: { sessionId_questionId: { sessionId: session.id, questionId } },
    update: data,
    create: {
      sessionId: session.id,
      questionId,
      order: question.order,
      maxScore: question.maxScore,
      ...data,
    },
  });

  return {
    questionId,
    status: answer.status,
    savedAt: answer.submittedAt ?? answer.updatedAt,
    /** Silence and blocked devices are proctoring signals too. */
    warnings:
      body.status !== "IN_PROGRESS" && (body.transcript ?? "").trim().length < 5
        ? ["No speech was captured for this answer."]
        : [],
  };
};

/* ------------------------------------------------------------- public: submit */

const candidateResultPayload = (
  session: {
    token: string;
    status: string;
    candidateName: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    passesInterview: boolean;
    integrityScore: number;
    riskLevel: string;
    violationCount: number;
    terminationReason: string | null;
    aiSummary: string | null;
    aiStrengths: string[];
    aiImprovements: string[];
    decision: InterviewDecision | null;
    reviewProvider: string | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
  },
  settings: unknown,
) => {
  const visible = showScoreToCandidate(settings);
  return {
    token: session.token,
    status: session.status,
    candidateName: session.candidateName,
    submittedAt: session.submittedAt,
    reviewedAt: session.reviewedAt,
    terminated: session.status === "TERMINATED",
    terminationReason: session.terminationReason,
    scoreVisible: visible,
    totalScore: visible ? session.totalScore : null,
    maxScore: visible ? session.maxScore : null,
    percentage: visible ? session.percentage : null,
    passes: visible ? session.passesInterview : null,
    integrityScore: session.integrityScore,
    riskLevel: session.riskLevel,
    violationCount: session.violationCount,
    summary: visible ? session.aiSummary : null,
    strengths: visible ? session.aiStrengths : [],
    improvements: visible ? session.aiImprovements : [],
    decision: visible ? session.decision : null,
    reviewProvider: session.reviewProvider,
  };
};

/**
 * Submits the interview, runs the AI review over every recorded answer and
 * reports marks + narrative back to the organisation (requirements 2 and 3).
 */
const submitSession = async (
  token: string,
  body: { reason: "CANDIDATE_SUBMIT" | "TIME_EXPIRED" | "PROCTORING" },
) => {
  const session = await prisma.interviewSession.findUnique({
    where: { token },
    include: { interview: true },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "This interview link is not valid");

  if (session.status === "REVIEWED" || session.status === "TERMINATED") {
    return candidateResultPayload(session, session.interview.settings);
  }
  if (session.status === "NOT_STARTED") {
    throw new ApiError(httpStatus.CONFLICT, "Start the interview before submitting it");
  }

  const interview = session.interview;
  await prisma.interviewSession.update({
    where: { id: session.id },
    data: { status: "PROCESSING", submittedAt: session.submittedAt ?? new Date() },
  });

  const [questions, answers] = await Promise.all([
    prisma.interviewQuestion.findMany({ where: { interviewId: interview.id } }),
    prisma.interviewAnswer.findMany({
      where: { sessionId: session.id },
      orderBy: { order: "asc" },
    }),
  ]);
  const answered = new Set(answers.map((answer) => answer.questionId));

  // Questions the candidate never answered are stored as skipped so the report
  // and the max-score denominator stay complete.
  const missing = questions.filter((question) => !answered.has(question.id));
  if (missing.length) {
    await prisma.interviewAnswer.createMany({
      data: missing.map((question) => ({
        sessionId: session.id,
        questionId: question.id,
        order: question.order,
        maxScore: question.maxScore,
        status: "SKIPPED",
        transcript: "",
        score: 0,
      })),
      skipDuplicates: true,
    });
  }


  const fullAnswers = await prisma.interviewAnswer.findMany({
    where: { sessionId: session.id },
    orderBy: { order: "asc" },
  });
  const questionById = new Map(questions.map((question) => [question.id, question]));

  const reviewAnswers: SessionReviewAnswer[] = [];
  for (const answer of fullAnswers) {
    const question = questionById.get(answer.questionId);
    if (!question) continue;

    if (!interview.aiReviewEnabled) {
      await prisma.interviewAnswer.update({
        where: { id: answer.id },
        data: {
          score: 0,
          maxScore: question.maxScore,
          status: answer.status === "PENDING" ? "SKIPPED" : answer.status,
          aiFeedback: "AI review is disabled for this interview.",
          aiReview: { verdict: "NOT_REVIEWED", provider: "none" } as never,
        },
      });
      reviewAnswers.push({
        order: answer.order,
        prompt: question.prompt,
        transcript: answer.transcript ?? "",
        hintsUsed: answer.hintsUsed,
        score: 0,
        maxScore: question.maxScore,
        verdict: "NO_ANSWER",
        strengths: [],
        improvements: ["AI review is disabled for this interview."],
      });
      continue;
    }

    const review = await reviewAnswer({
      questionPrompt: question.prompt,
      hints: question.hints,
      expectedKeywords: question.expectedKeywords,
      modelAnswer: question.modelAnswer,
      transcript: answer.transcript ?? "",
      hintsUsed: answer.hintsUsed,
      timeSpentSeconds: answer.timeSpentSeconds ?? 0,
      timeLimitSeconds: questionTimeFor(interview, question),
      maxScore: question.maxScore,
    });

    await prisma.interviewAnswer.update({
      where: { id: answer.id },
      data: {
        score: review.score,
        maxScore: review.maxScore,
        keywordHits: review.keywordHits,
        missingKeywords: review.missingKeywords,
        aiFeedback: review.feedback,
        aiStrengths: review.strengths,
        aiImprovements: review.improvements,
        aiConfidence: review.confidence,
        aiReview: { verdict: review.verdict, provider: review.provider } as never,
        status: answer.status === "PENDING" ? "SKIPPED" : answer.status,
      },
    });

    reviewAnswers.push({
      order: answer.order,
      prompt: question.prompt,
      transcript: answer.transcript ?? "",
      hintsUsed: answer.hintsUsed,
      score: review.score,
      maxScore: review.maxScore,
      verdict: review.verdict,
      strengths: review.strengths,
      improvements: review.improvements,
    });
  }


  /* -------- session-level AI review: marks, decision and narrative -------- */

  const integrityScore = session.integrityScore;
  const violations = await prisma.interviewViolation.findMany({
    where: { sessionId: session.id },
    orderBy: { occurredAt: "asc" },
  });
  const sessionReview = await reviewSession({
    interviewTitle: interview.title,
    technology: interview.technology,
    candidateName: session.candidateName,
    passScore: interview.passScore,
    answers: reviewAnswers,
    violations: violations.map((violation) => ({
      type: violation.type,
      severity: violation.severity,
      description: violation.description,
    })),
    integrityScore,
    terminated: false,
  });

  const updated = await prisma.interviewSession.update({
    where: { id: session.id },
    data: {
      status: "REVIEWED",
      reviewedAt: new Date(),
      totalScore: sessionReview.totalScore,
      maxScore: sessionReview.maxScore,
      percentage: sessionReview.percentage,
      passesInterview: sessionReview.passes,
      decision: sessionReview.decision as InterviewDecision,
      aiSummary: sessionReview.summary,
      aiStrengths: sessionReview.strengths,
      aiImprovements: sessionReview.improvements,
      reviewProvider: sessionReview.provider,
      aiReview: {
        submitReason: body.reason,
        provider: sessionReview.provider,
        answers: reviewAnswers.map((answer) => ({
          order: answer.order,
          question: answer.prompt,
          score: answer.score,
          maxScore: answer.maxScore,
          verdict: answer.verdict,
          hintsUsed: answer.hintsUsed,
        })),
      } as never,
    },
  });

  await notifyCompany(interview, {
    sessionId: session.id,
    title: "AI interview report ready",
    message: `${session.candidateName} completed the ${interview.technology} interview: ${sessionReview.totalScore}/${sessionReview.maxScore} (${sessionReview.percentage}%) — ${sessionReview.decision.replace("_", " ").toLowerCase()}.`,
    terminated: false,
  });
  await writeAuditLog({
    actorId: session.candidateId,
    action: "interview.session.submitted",
    entityType: "InterviewSession",
    entityId: session.id,
    newValue: {
      totalScore: sessionReview.totalScore,
      percentage: sessionReview.percentage,
      decision: sessionReview.decision,
      provider: sessionReview.provider,
    },
  });

  return candidateResultPayload(updated, interview.settings);
};

/** Candidate-visible outcome of a session (used by the thank-you screen). */
const getSessionResult = async (token: string) => {
  const session = await prisma.interviewSession.findUnique({
    where: { token },
    include: { interview: true },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "This interview link is not valid");
  return candidateResultPayload(session, session.interview.settings);
};



/* ------------------------------------------------- recruiter: sessions & report */

const listSessions = async (
  user: IAuthUser,
  interviewId: string,
  query: { page?: number; limit?: number; status?: string; decision?: string },
) => {
  await assertInterviewAccess(user, interviewId);
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  const where: Record<string, unknown> = { interviewId };
  if (query.status) where.status = query.status;
  if (query.decision) where.decision = query.decision;

  const [total, data] = await Promise.all([
    prisma.interviewSession.count({ where }),
    prisma.interviewSession.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        token: true,
        candidateName: true,
        candidateEmail: true,
        status: true,
        decision: true,
        totalScore: true,
        maxScore: true,
        percentage: true,
        passesInterview: true,
        integrityScore: true,
        riskLevel: true,
        violationCount: true,
        startedAt: true,
        submittedAt: true,
        reviewedAt: true,
        terminatedAt: true,
        terminationReason: true,
        reviewProvider: true,
        emailSentAt: true,
        emailVerifiedAt: true,
        expiresAt: true,
        _count: { select: { answers: true, violations: true } },
      },
    }),
  ]);

  return {
    data: data.map(({ _count, ...session }) => ({
      ...session,
      link: `${config.interview.link_base_url}/interview/${session.token}`,
      answerTotal: _count.answers,
      violationTotal: _count.violations,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

/** Full AI review for one candidate: marks, transcripts, telemetry and violations. */
const getSessionReport = async (user: IAuthUser, interviewId: string, sessionId: string) => {
  const interview = await assertInterviewAccess(user, interviewId);
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, interviewId },
    include: {
      answers: { orderBy: { order: "asc" }, include: { question: true } },
      violations: { orderBy: { occurredAt: "asc" } },
      candidate: { select: { id: true, name: true, email: true } },
    },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "Interview session not found");

  return {
    interview: {
      id: interview.id,
      title: interview.title,
      technology: interview.technology,
      jobRole: interview.jobRole,
      passScore: interview.passScore,
      questionTimeSeconds: interview.questionTimeSeconds,
      proctoringEnabled: interview.proctoringEnabled,
    },
    session: {
      id: session.id,
      token: session.token,
      candidateId: session.candidateId,
      candidateName: session.candidateName,
      candidateEmail: session.candidateEmail,
      candidate: session.candidate,
      status: session.status,
      decision: session.decision,
      totalScore: session.totalScore,
      maxScore: session.maxScore,
      percentage: session.percentage,
      passesInterview: session.passesInterview,
      integrityScore: session.integrityScore,
      riskLevel: session.riskLevel,
      violationCount: session.violationCount,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      reviewedAt: session.reviewedAt,
      terminatedAt: session.terminatedAt,
      terminationReason: session.terminationReason,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      aiSummary: session.aiSummary,
      aiStrengths: session.aiStrengths,
      aiImprovements: session.aiImprovements,
      aiReview: session.aiReview,
      reviewProvider: session.reviewProvider,
    },
    answers: session.answers.map((answer) => ({
      id: answer.id,
      order: answer.order,
      questionId: answer.questionId,
      prompt: answer.question.prompt,
      topic: answer.question.topic,
      expectedKeywords: answer.question.expectedKeywords,
      hints: answer.question.hints,
      modelAnswer: answer.question.modelAnswer,
      timeSeconds: questionTimeFor(interview, answer.question),
      transcript: answer.transcript,
      recordingUrl: answer.recordingUrl,
      recordingSeconds: answer.recordingSeconds,
      audioLevelAvg: answer.audioLevelAvg,
      snapshots: answer.snapshots,
      videoFrames: answer.videoFrames,
      hintsUsed: answer.hintsUsed,
      hintsRevealed: answer.hintsRevealed,
      timeSpentSeconds: answer.timeSpentSeconds,
      status: answer.status,
      score: answer.score,
      maxScore: answer.maxScore,
      keywordHits: answer.keywordHits,
      missingKeywords: answer.missingKeywords,
      aiFeedback: answer.aiFeedback,
      aiStrengths: answer.aiStrengths,
      aiImprovements: answer.aiImprovements,
      aiConfidence: answer.aiConfidence,
      submittedAt: answer.submittedAt,
    })),
    violations: session.violations,
  };
};

/** Re-runs the AI review for a session (e.g. after enabling the LLM provider). */
const reReviewSession = async (user: IAuthUser, interviewId: string, sessionId: string) => {
  await assertInterviewAccess(user, interviewId);
  const session = await prisma.interviewSession.findFirst({
    where: { id: sessionId, interviewId },
  });
  if (!session) throw new ApiError(httpStatus.NOT_FOUND, "Interview session not found");
  if (session.status === "NOT_STARTED" || session.status === "IN_PROGRESS") {
    throw new ApiError(httpStatus.CONFLICT, "The candidate has not submitted this interview yet");
  }
  if (session.status === "TERMINATED") {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Terminated sessions always score 0 and are not re-reviewed",
    );
  }

  await prisma.interviewSession.update({ where: { id: sessionId }, data: { status: "PROCESSING" } });
  const result = await submitSession(session.token, { reason: "CANDIDATE_SUBMIT" });
  await writeAuditLog({
    actorId: user.id,
    action: "interview.session.re-review",
    entityType: "InterviewSession",
    entityId: sessionId,
  });
  return result;
};

/** Aggregate results for the hiring team: averages, per-question and violations. */
const getInterviewReport = async (user: IAuthUser, interviewId: string) => {
  const interview = await assertInterviewAccess(user, interviewId);

  const [sessions, perQuestion, violations, questionTotal] = await Promise.all([
    prisma.interviewSession.findMany({
      where: { interviewId },
      orderBy: [{ percentage: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        status: true,
        decision: true,
        totalScore: true,
        maxScore: true,
        percentage: true,
        passesInterview: true,
        integrityScore: true,
        riskLevel: true,
        violationCount: true,
        startedAt: true,
        submittedAt: true,
      },
    }),
    prisma.interviewAnswer.groupBy({
      by: ["questionId"],
      where: { session: { interviewId } },
      _avg: { score: true, maxScore: true, timeSpentSeconds: true, hintsUsed: true },
      _count: { _all: true },
    }),
    prisma.interviewViolation.groupBy({
      by: ["type"],
      where: { session: { interviewId } },
      _count: { _all: true },
    }),
    prisma.interviewQuestion.count({ where: { interviewId } }),
  ]);

  const questions = await prisma.interviewQuestion.findMany({
    where: { interviewId },
    orderBy: { order: "asc" },
    select: { id: true, order: true, prompt: true, topic: true },
  });
  const questionById = new Map(questions.map((question) => [question.id, question]));

  const reviewed = sessions.filter(
    (session) => session.status === "REVIEWED" || session.status === "TERMINATED",
  );
  const passed = reviewed.filter((session) => session.passesInterview).length;
  const terminated = sessions.filter((session) => session.status === "TERMINATED").length;
  const inProgress = sessions.filter((session) => session.status === "IN_PROGRESS").length;
  const average = (values: number[]) =>
    values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;

  const decisionCounts = sessions.reduce<Record<string, number>>((acc, session) => {
    const key = session.decision ?? "PENDING";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    interview: {
      id: interview.id,
      title: interview.title,
      technology: interview.technology,
      seniority: interview.seniority,
      status: interview.status,
      questionTimeSeconds: interview.questionTimeSeconds,
      passScore: interview.passScore,
      questionTotal,
      candidateLink: `${config.interview.link_base_url}/interview/${interview.accessToken}`,
    },
    summary: {
      totalSessions: sessions.length,
      reviewed: reviewed.length,
      inProgress,
      terminated,
      averagePercentage: average(reviewed.map((session) => session.percentage)),
      averageIntegrity: average(sessions.map((session) => session.integrityScore)),
      passRate: reviewed.length ? Math.round((passed / reviewed.length) * 1000) / 10 : 0,
      decisionCounts,
    },
    perQuestion: perQuestion
      .map((row) => {
        const question = questionById.get(row.questionId);
        const maxScore = row._avg.maxScore ?? 10;
        return {
          questionId: row.questionId,
          order: question?.order ?? 0,
          prompt: question?.prompt ?? "Question removed",
          topic: question?.topic ?? null,
          attempts: row._count._all,
          averageScore: row._avg.score === null ? 0 : Math.round((row._avg.score ?? 0) * 10) / 10,
          maxScore,
          averagePercentage: maxScore
            ? Math.round((((row._avg.score ?? 0) / maxScore) * 100) * 10) / 10
            : 0,
          averageSeconds: Math.round(row._avg.timeSpentSeconds ?? 0),
          averageHintsUsed: Math.round((row._avg.hintsUsed ?? 0) * 10) / 10,
        };
      })
      .sort((a, b) => a.order - b.order),
    violations: violations
      .map((row) => ({
        type: row.type,
        count: row._count._all,
        label: HUMAN_VIOLATION_LABEL[row.type],
        severity: VIOLATION_SEVERITY[row.type],
      }))
      .sort((a, b) => b.count - a.count),
    candidates: sessions.map((session) => ({
      ...session,
      link: `${config.interview.link_base_url}/interview/${session.id}`,
    })),
  };
};

/* -------------------------------------------------------------------- exports */

export const InterviewService = {
  // reference data
  listTechnologies,
  // recruiter: interviews
  createInterview,
  listInterviews,
  getInterview,
  updateInterview,
  deleteInterview,
  publishInterview: (user: IAuthUser, interviewId: string) =>
    setStatus(user, interviewId, InterviewStatus.ACTIVE, "publish"),
  closeInterview: (user: IAuthUser, interviewId: string) =>
    setStatus(user, interviewId, InterviewStatus.CLOSED, "close"),
  // recruiter: questions
  regenerateQuestions,
  addCustomQuestion,
  updateQuestion,
  deleteQuestion,
  listBankQuestions,
  addBankQuestions,
  // recruiter: sessions & reporting
  createSessionLink,
  searchInvitableCandidates,
  inviteCandidates,
  resendInvite,
  listSessions,
  getSessionReport,
  reReviewSession,
  getInterviewReport,
  // candidate (public link)
  getPublicInterview,
  startSession,
  requestVerificationCode,
  confirmVerificationCode,
  reportViolation,
  getSessionState,
  saveAnswer,
  submitSession,
  getSessionResult,
};

