import { z } from "zod";
import { emailSchema } from "../../helpers/zodSchemas";

/* ------------------------------------------------------------- shared bits */

export const interviewParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid interview id") }),
});

export const interviewSessionParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid interview id"),
    sessionId: z.string().uuid("Invalid session id"),
  }),
});

export const interviewQuestionParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid interview id"),
    questionId: z.string().uuid("Invalid question id"),
  }),
});

/** Public endpoints are reached with either an interview link or a session token. */
export const linkTokenSchema = z
  .string()
  .min(10, "Invalid interview link")
  .max(120, "Invalid interview link")
  .regex(/^[A-Za-z0-9_-]+$/, "Invalid interview link");

export const sessionTokenParamsSchema = z.object({
  params: z.object({ token: linkTokenSchema }),
});

export const sessionQuestionParamsSchema = z.object({
  params: z.object({
    token: linkTokenSchema,
    questionId: z.string().uuid("Invalid question id"),
  }),
});

const interviewSettingsShape = {
  title: z.string().min(3, "Title must be at least 3 characters").max(160),
  description: z.string().max(2000).optional(),
  jobRole: z.string().max(120).optional(),
  technology: z.string().min(2, "Technology is required").max(60),
  seniority: z.enum(["JUNIOR", "MID", "SENIOR", "LEAD"]).default("MID"),
  questionCount: z.coerce.number().int().min(1).max(30).default(10),
  questionTimeSeconds: z.coerce.number().int().min(30).max(3600).default(300),
  totalTimeSeconds: z.coerce.number().int().min(60).max(36000).nullish(),
  shuffleQuestions: z.boolean().default(true),
  hintsEnabled: z.boolean().default(true),
  proctoringEnabled: z.boolean().default(true),
  terminateOnCritical: z.boolean().default(true),
  aiReviewEnabled: z.boolean().default(true),
  passScore: z.coerce.number().int().min(0).max(100).default(60),
  maxViolations: z.coerce.number().int().min(0).max(20).default(2),
  /** When the candidate link becomes active. */
  startsAt: z.string().datetime().nullish(),
  expiresAt: z.string().datetime().nullish(),
  /** Candidate-visible behaviour after submission. */
  showScoreToCandidate: z.boolean().default(true),
};

export const customQuestionSchema = z
  .object({
    prompt: z.string().min(10, "Question must be at least 10 characters").max(2000),
    hints: z.array(z.string().min(1).max(300)).max(5).default([]),
    expectedKeywords: z.array(z.string().min(1).max(60)).max(20).default([]),
    modelAnswer: z.string().max(4000).optional(),
    timeSeconds: z.coerce.number().int().min(30).max(3600).nullish(),
    maxScore: z.coerce.number().int().min(1).max(100).default(10),
    topic: z.string().max(80).optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  })
  .strict();

export const createInterviewSchema = z.object({
  body: z
    .object({
      ...interviewSettingsShape,
      /** Requirement: the active window is mandatory when creating an interview. */
      startsAt: z.string().datetime({ offset: true, message: "Link activation time is required" }),
      expiresAt: z.string().datetime({ offset: true, message: "Exam close time is required" }),
      /** Optional custom questions added at creation time (requirement 7). */
      customQuestions: z.array(customQuestionSchema).max(30).default([]),
      /** When false the organisation supplies every question itself. */
      useBankQuestions: z.boolean().default(true),
      companyId: z.string().uuid().optional(),
    })
    .strict()
    .refine(
      (value) => new Date(value.expiresAt).getTime() > new Date(value.startsAt).getTime(),
      { message: "The exam close time must be after the link activation time", path: ["expiresAt"] },
    ),
});

export const updateInterviewSchema = z.object({
  params: interviewParamsSchema.shape.params,
  body: z
    .object({
      title: interviewSettingsShape.title.optional(),
      description: z.string().max(2000).nullish(),
      jobRole: z.string().max(120).nullish(),
      technology: interviewSettingsShape.technology.optional(),
      seniority: interviewSettingsShape.seniority.optional(),
      questionCount: z.coerce.number().int().min(1).max(30).optional(),
      questionTimeSeconds: z.coerce.number().int().min(30).max(3600).optional(),
      totalTimeSeconds: z.coerce.number().int().min(60).max(36000).nullish(),
      shuffleQuestions: z.boolean().optional(),
      hintsEnabled: z.boolean().optional(),
      proctoringEnabled: z.boolean().optional(),
      terminateOnCritical: z.boolean().optional(),
      aiReviewEnabled: z.boolean().optional(),
      passScore: z.coerce.number().int().min(0).max(100).optional(),
      maxViolations: z.coerce.number().int().min(0).max(20).optional(),
      startsAt: z.string().datetime({ offset: true }).nullish(),
      expiresAt: z.string().datetime({ offset: true }).nullish(),
      showScoreToCandidate: z.boolean().optional(),
      status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]).optional(),
    })
    .strict(),
});

export const regenerateQuestionsSchema = z.object({
  params: interviewParamsSchema.shape.params,
  body: z
    .object({
      questionCount: z.coerce.number().int().min(1).max(30).optional(),
      /** Keep organisation-written questions when reshuffling the bank sample. */
      keepCustomQuestions: z.boolean().default(true),
    })
    .strict()
    .default({ keepCustomQuestions: true }),
});

export const createSessionLinkSchema = z.object({
  params: interviewParamsSchema.shape.params,
  body: z
    .object({
      candidateName: z.string().min(1, "Candidate name is required").max(120),
      candidateEmail: emailSchema,
    })
    .strict(),
});

export const interviewListQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      q: z.string().optional(),
      status: z.enum(["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"]).optional(),
      technology: z.string().optional(),
      companyId: z.string().uuid().optional(),
    })
    .strict(),
});

export const interviewSessionsQuerySchema = z.object({
  params: interviewParamsSchema.shape.params,
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      status: z
        .enum(["NOT_STARTED", "IN_PROGRESS", "PROCESSING", "REVIEWED", "TERMINATED"])
        .optional(),
      decision: z.enum(["STRONG_HIRE", "HIRE", "MAYBE", "NO_HIRE"]).optional(),
    })
    .strict(),
});

/* --------------------------------------------------------- public endpoints */

export const startSessionSchema = z.object({
  params: sessionTokenParamsSchema.shape.params,
  body: z
    .object({
      candidateName: z.string().min(1, "Your name is required").max(120).optional(),
      candidateEmail: emailSchema.optional(),
      /** Camera/microphone consent + proctoring acknowledgement (requirements 4 and 9). */
      consentGiven: z.literal(true, {
        error: "You must accept the interview and recording terms",
      }),
      deviceInfo: z.record(z.string(), z.unknown()).optional(),
    })
    .strict(),
});

/** Evidence snapshots are small base64 JPEGs captured by the candidate's browser. */
const snapshotSchema = z
  .string()
  .max(400_000, "Snapshot is too large")
  .regex(/^data:image\/(jpeg|png|webp);base64,/, "Snapshot must be a base64 image");

/**
 * The recorded answer clip: either a URL from organisation-managed object
 * storage, or the webm/mp4 recording uploaded inline as a base64 data URL
 * (bounded by `INTERVIEW_MAX_UPLOAD_MB`).
 */
const recordingUrlSchema = z
  .string()
  .max(7_000_000, "Recording is too large")
  .refine(
    (value) => /^https?:\/\//i.test(value) || /^data:video\//i.test(value),
    "Recording must be an http(s) URL or an inline video recording",
  );

export const reportViolationSchema = z.object({
  params: sessionTokenParamsSchema.shape.params,
  body: z
    .object({
      type: z.enum([
        "TAB_SWITCH",
        "WINDOW_BLUR",
        "FULLSCREEN_EXIT",
        "MULTIPLE_FACES",
        "DEVICE_DETECTED",
        "NOISE_DETECTED",
        "FACE_NOT_VISIBLE",
        "CAMERA_BLOCKED",
        "MICROPHONE_BLOCKED",
        "LOOKING_AWAY",
        "COPY",
        "PASTE",
      ]),
      questionId: z.string().uuid().optional(),
      description: z.string().max(500).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      snapshot: snapshotSchema.optional(),
    })
    .strict(),
});

export const saveAnswerSchema = z.object({
  params: sessionQuestionParamsSchema.shape.params,
  body: z
    .object({
      transcript: z.string().max(20_000).optional(),
      recordingUrl: recordingUrlSchema.optional(),
      recordingMime: z.string().max(100).optional(),
      recordingSeconds: z.coerce.number().int().min(0).max(7200).optional(),
      audioLevelAvg: z.coerce.number().min(0).max(1).optional(),
      videoFrames: z.record(z.string(), z.unknown()).optional(),
      snapshots: z.array(snapshotSchema).max(6).optional(),
      hintsUsed: z.coerce.number().int().min(0).max(10).default(0),
      hintsRevealed: z.array(z.string().max(300)).max(10).default([]),
      timeSpentSeconds: z.coerce.number().int().min(0).max(7200).default(0),
      startedAt: z.string().datetime().optional(),
      status: z.enum(["SUBMITTED", "SKIPPED", "IN_PROGRESS"]).default("SUBMITTED"),
    })
    .strict(),
});

export const submitSessionSchema = z.object({
  params: sessionTokenParamsSchema.shape.params,
  body: z
    .object({
      reason: z.enum(["CANDIDATE_SUBMIT", "TIME_EXPIRED", "PROCTORING"]).default("CANDIDATE_SUBMIT"),
    })
    .strict()
    .default({ reason: "CANDIDATE_SUBMIT" }),
});

/* ------------------------------------------------- recruiter: question editing */

export const addQuestionSchema = z.object({
  params: interviewParamsSchema.shape.params,
  body: customQuestionSchema,
});

export const updateQuestionSchema = z.object({
  params: interviewQuestionParamsSchema.shape.params,
  body: customQuestionSchema.partial().strict(),
});

/* -------------------------------------------------- recruiter: invitations */

/** Invite one or more candidates to a video interview (emails the secured link). */
export const inviteCandidatesSchema = z.object({
  params: interviewParamsSchema.shape.params,
  body: z
    .object({
      candidates: z
        .array(
          z
            .object({
              email: emailSchema,
              name: z.string().max(120).optional(),
              /** Send the invitation email immediately (default true). */
              sendEmail: z.boolean().default(true),
            })
            .strict(),
        )
        .min(1, "Add at least one candidate")
        .max(200),
    })
    .strict(),
});

/** Search existing platform users (e.g. people who sat other exams). */
export const candidateSearchSchema = z.object({
  query: z.object({
    q: z.string().max(120).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

/* ---------------------------------------------------- recruiter: bank questions */

/** Browse the built-in interview question bank for a technology. */
export const bankQuerySchema = z.object({
  query: z.object({
    technology: z.string().min(2).max(60),
    q: z.string().max(120).optional(),
  }),
});

/** Add selected bank questions to an interview (requirement 6). */
export const addBankQuestionsSchema = z.object({
  params: interviewParamsSchema.shape.params,
  body: z
    .object({
      keys: z.array(z.string().min(1).max(120)).min(1).max(60),
    })
    .strict(),
});

/* ------------------------------------------------ candidate: email verification */

/** Ask for a one-time code to prove ownership of the invited email address. */
export const requestVerifyCodeSchema = z.object({
  params: sessionTokenParamsSchema.shape.params,
});

/** Submit the one-time code; on success the session is bound to the email owner. */
export const confirmVerifyCodeSchema = z.object({
  params: sessionTokenParamsSchema.shape.params,
  body: z
    .object({
      code: z
        .string()
        .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
    })
    .strict(),
});
