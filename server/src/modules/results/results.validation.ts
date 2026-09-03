import { z } from "zod";

export const resultParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid result id") }),
});

export const candidateResultsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict(),
});
