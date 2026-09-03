import { z } from "zod";

export const createAssessmentSchema = z.object({
  body: z
    .object({
      title: z.string().min(3, "Title must be at least 3 characters").max(300),
      description: z.string().max(3000).optional(),
      instructions: z.string().max(5000).optional(),
      durationMinutes: z.number().int().min(5).max(1440),
      passingScore: z.number().int().min(0).default(0),
      startDate: z.string().datetime().optional().nullable(),
      endDate: z.string().datetime().optional().nullable(),
      maxAttempts: z.number().int().min(1).max(10).default(1),
      shuffleProblems: z.boolean().default(false),
      shuffleOptions: z.boolean().default(false),
      showResults: z.boolean().default(true),
      antiCheatingEnabled: z.boolean().default(true),
      showCandidateRanking: z.boolean().default(true),
      resultStrategy: z.enum(["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"]).default("LATEST_SCORE"),
      accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"]).default("INVITATION_ONLY"),
      accessCode: z.string().min(4).max(50).optional(),
      templateId: z.string().uuid().optional(),
      companyId: z.string().uuid().optional(),
    })
    .strict(),
});

export const updateAssessmentSchema = z.object({
  body: z
    .object({
      title: z.string().min(3).max(300).optional(),
      description: z.string().max(3000).optional().nullable(),
      instructions: z.string().max(5000).optional().nullable(),
      durationMinutes: z.number().int().min(5).max(1440).optional(),
      passingScore: z.number().int().min(0).optional(),
      startDate: z.string().datetime().optional().nullable(),
      endDate: z.string().datetime().optional().nullable(),
      maxAttempts: z.number().int().min(1).max(10).optional(),
      shuffleProblems: z.boolean().optional(),
      shuffleOptions: z.boolean().optional(),
      showResults: z.boolean().optional(),
      antiCheatingEnabled: z.boolean().optional(),
      showCandidateRanking: z.boolean().optional(),
      resultStrategy: z.enum(["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"]).optional(),
      accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"]).optional(),
      accessCode: z.string().min(4).max(50).optional().nullable(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const assessmentQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      sortBy: z
        .enum([
          "createdAt",
          "updatedAt",
          "title",
          "status",
          "durationMinutes",
          "startDate",
        ])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      q: z.string().optional(),
      status: z.enum(["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"]).optional(),
      companyId: z.string().uuid().optional(),
    })
    .strict(),
});

export const assessmentParams = z.object({
  params: z.object({ id: z.string().uuid("Invalid assessment id") }),
});

export const assessmentProblemListQuery = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict(),
});
