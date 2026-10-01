import { z } from "zod";

export const createCompanySchema = z.object({
  body: z
    .object({
      name: z.string().min(2, "Company name is required").max(200),
      logo: z.string().url().optional(),
      description: z.string().max(3000).optional(),
      website: z.string().url().optional(),
      industry: z.string().max(200).optional(),
      location: z.string().max(200).optional(),
      size: z.string().max(100).optional(),
    })
    .strict(),
});

export const updateCompanySchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(200).optional(),
      logo: z.string().url().optional().nullable(),
      description: z.string().max(3000).optional().nullable(),
      website: z.string().url().optional().nullable(),
      industry: z.string().max(200).optional().nullable(),
      location: z.string().max(200).optional().nullable(),
      size: z.string().max(100).optional().nullable(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid id") }),
});

export const memberParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid company id"),
    userId: z.string().uuid("Invalid user id"),
  }),
});

const memberRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);

export const inviteMemberSchema = z.object({
  body: z
    .object({
      email: z.string().email("A valid email is required"),
      name: z.string().min(2).max(100).optional(),
      role: memberRoleSchema.default("MEMBER"),
    })
    .strict(),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({ role: memberRoleSchema }).strict(),
});
