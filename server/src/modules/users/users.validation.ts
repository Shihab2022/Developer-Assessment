import { z } from "zod";
import { passwordSchema } from "../../helpers/zodSchemas";

export const updateMeSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().optional().nullable(),
      bio: z.string().max(2000).optional().nullable(),
      skills: z.array(z.string()).optional(),
      experience: z.number().int().min(0).optional().nullable(),
      education: z.any().optional().nullable(),
      profileImageUrl: z.string().url().optional().nullable(),
      resumeUrl: z.string().url().optional().nullable(),
      jobTitle: z.string().max(200).optional().nullable(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided",
    }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordSchema,
    })
    .strict(),
});