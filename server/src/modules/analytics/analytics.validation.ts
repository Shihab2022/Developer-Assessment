import { z } from "zod";

export const analyticsParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid assessment id") }),
});
