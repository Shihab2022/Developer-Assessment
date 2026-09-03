import { z } from "zod";
import { emailSchema, passwordSchema } from "../../helpers/zodSchemas";

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").max(100),
      email: emailSchema,
      password: passwordSchema,
      role: z.enum(["CANDIDATE", "RECRUITER"]).default("CANDIDATE"),
      phone: z.string().optional(),
      companyId: z.string().uuid().optional(),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: z.string().min(1, "Password is required"),
    })
    .strict(),
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    })
    .strict(),
});