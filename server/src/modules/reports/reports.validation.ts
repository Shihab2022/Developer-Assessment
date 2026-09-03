import { z } from "zod";

export const assessmentReportParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid assessment id") }),
});

export const companyReportParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid company id") }),
});
