import { z } from "zod";

export const adminUserParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid user id") }),
});

export const adminUserStatusSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid user id") }),
  body: z
    .object({
      status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
    })
    .strict(),
});

export const adminUserRoleSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid user id") }),
  body: z
    .object({
      role: z.enum(["CANDIDATE", "RECRUITER", "ADMIN"]),
    })
    .strict(),
});

export const adminListQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      q: z.string().optional(),
      role: z.enum(["CANDIDATE", "RECRUITER", "ADMIN"]).optional(),
      status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    })
    .strict(),
});

export const adminAuditQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
      actorId: z.string().uuid().optional(),
    })
    .strict(),
});
