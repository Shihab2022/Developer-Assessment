import { z } from "zod";

export const createTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300),
    description: z.string().max(3000).optional(),
    durationMinutes: z.number().int().min(5).max(1440),
    passingScore: z.number().int().min(0).optional(),
    maxAttempts: z.number().int().min(1).max(10).optional(),
    shuffleProblems: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    showResults: z.boolean().optional(),
    antiCheatingEnabled: z.boolean().optional(),
    resultStrategy: z.enum(["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"]).optional(),
    accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"]).optional(),
    questionConfig: z.any().optional(),
    skills: z.array(z.string()).optional(),
    difficultyDistribution: z.any().optional(),
    antiCheatingSettings: z.any().optional(),
    companyId: z.string().uuid().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  }).strict(),
});

export const updateTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300).optional(),
    description: z.string().max(3000).optional().nullable(),
    durationMinutes: z.number().int().min(5).max(1440).optional(),
    passingScore: z.number().int().min(0).optional(),
    maxAttempts: z.number().int().min(1).max(10).optional(),
    shuffleProblems: z.boolean().optional(),
    shuffleOptions: z.boolean().optional(),
    showResults: z.boolean().optional(),
    antiCheatingEnabled: z.boolean().optional(),
    resultStrategy: z.enum(["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"]).optional(),
    accessLevel: z.enum(["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"]).optional(),
    questionConfig: z.any().optional(),
    skills: z.array(z.string()).optional(),
    difficultyDistribution: z.any().optional(),
    antiCheatingSettings: z.any().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" }),
});

export const templateQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    q: z.string().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
    companyId: z.string().uuid().optional(),
  }).strict(),
});

export const templateParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid template id") }),
});

export const useTemplateSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(300).optional(),
    companyId: z.string().uuid().optional(),
  }).strict(),
});
