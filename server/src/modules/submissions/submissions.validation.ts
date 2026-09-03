import { z } from "zod";

export const createSubmissionSchema = z.object({
  body: z
    .object({
      attemptId: z.string().uuid(),
      problemId: z.string().uuid(),
      code: z.string().min(1, "Code is required").max(200000),
      programmingLanguage: z.enum([
        "javascript",
        "python",
        "java",
        "cpp",
        "typescript",
        "go",
        "rust",
      ]),
    })
    .strict(),
});

export const submissionParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid submission id") }),
});

export const attemptSubmissionsQuerySchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid attempt id") }),
});