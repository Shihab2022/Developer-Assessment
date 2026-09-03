import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const emailSchema = z.string().email("Invalid email address");

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid id format"),
  }),
});

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    q: z.string().optional(),
  }),
});

export const getAllQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      q: z.string().optional(),
      status: z.string().optional(),
      type: z.string().optional(),
      difficulty: z.string().optional(),
      category: z.string().optional(),
      companyId: z.string().uuid().optional(),
      tags: z.string().optional(),
      role: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .passthrough(),
});