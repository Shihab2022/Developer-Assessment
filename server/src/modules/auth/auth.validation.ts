import { z } from "zod";
import { emailSchema, passwordSchema } from "../../helpers/zodSchemas";

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters").max(100),
      email: emailSchema,
      password: passwordSchema,
      role: z
        .enum(["CANDIDATE", "RECRUITER", "COMPANY", "ADMIN"])
        .default("CANDIDATE"),
      phone: z.string().max(30).optional(),
      /** Deprecated in the UI — recruiters now join with `companyCode`. */
      companyId: z.string().uuid().optional(),
      /** Company name — required to found a company (COMPANY role). */
      companyName: z.string().min(2, "Company name is required").max(200).optional(),
      /** Friendly join code — used by a recruiter joining an existing company. */
      companyCode: z.string().min(3).max(40).optional(),
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

export const verifyEmailSchema = z.object({
  body: z
    .object({
      token: z.string().min(10, "A valid verification token is required"),
    })
    .strict(),
});

export const resendVerificationSchema = z.object({
  body: z
    .object({
      email: emailSchema,
    })
    .strict(),
});
