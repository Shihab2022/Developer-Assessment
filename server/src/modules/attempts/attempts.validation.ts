import { z } from "zod";

export const attemptParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid attempt id") }),
});

export const startAttemptSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid assessment id") }),
  body: z.object({}).optional(),
});

export const saveAnswerSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid attempt id") }),
  body: z
    .object({
      problemId: z.string().uuid("Invalid problem id"),
      answer: z.any().optional(),
      code: z.string().max(200000).optional(),
      programmingLanguage: z
        .enum(["javascript", "python", "java", "cpp", "typescript", "go", "rust"])
        .optional(),
    })
    .strict()
    .refine((data) => data.answer !== undefined || data.code !== undefined, {
      message: "Either answer or code must be provided",
    }),
});

export const updateAnswerSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid attempt id"),
    answerId: z.string().uuid("Invalid answer id"),
  }),
  body: z
    .object({
      answer: z.any().optional(),
      code: z.string().max(200000).optional(),
      programmingLanguage: z
        .enum(["javascript", "python", "java", "cpp", "typescript", "go", "rust"])
        .optional(),
    })
    .strict(),
});

export const antiCheatingEventSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid attempt id") }),
  body: z
    .object({
      eventType: z.enum([
        "TAB_SWITCH",
        "WINDOW_BLUR",
        "WINDOW_FOCUS",
        "FULLSCREEN_EXIT",
        "COPY",
        "PASTE",
        "MULTIPLE_SESSION",
        "SUSPICIOUS_ACTIVITY",
      ]),
      metadata: z.any().optional(),
    })
    .strict(),
});

export const candidatesAttemptsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      status: z.string().optional(),
    })
    .strict(),
});
