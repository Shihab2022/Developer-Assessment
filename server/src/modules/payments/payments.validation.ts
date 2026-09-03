import { z } from "zod";

export const initiatePaymentSchema = z.object({
  body: z
    .object({
      packageId: z.string().uuid("Invalid package id"),
      companyId: z.string().uuid("Invalid company id").optional(),
    })
    .strict(),
});

export const paymentParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid payment id") }),
});

export const paymentListQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      status: z
        .enum(["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"])
        .optional(),
    })
    .strict(),
});

export const paymentCallbackSchema = z.object({
  body: z.record(z.string(), z.any()).optional(),
  query: z.record(z.string(), z.any()).optional(),
});