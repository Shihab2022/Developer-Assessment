import { z } from "zod";

export const writtenEvaluationSchema = z.object({
  body: z
    .object({
      attemptId: z.string().uuid(),
      problemId: z.string().uuid(),
      score: z.number().int().min(0).max(1000),
      feedback: z.string().max(5000).optional(),
    })
    .strict(),
});

export const evaluationParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid evaluation id") }),
});

export const attemptEvaluationsQuery = z.object({
  params: z.object({ id: z.string().uuid("Invalid attempt id") }),
});
