import { z } from "zod";
import { emailSchema } from "../../helpers/zodSchemas";

export const createInvitationSchema = z.object({
  body: z
    .object({
      candidates: z
        .array(
          z.object({
            email: emailSchema,
            expiresAt: z.string().datetime().optional(),
          }),
        )
        .min(1, "At least one candidate email is required")
        .max(500, "Cannot create more than 500 invitations at once"),
    })
    .strict(),
});

export const invitationParamsSchema = z.object({
  params: z.object({ id: z.string().uuid("Invalid invitation id") }),
});

export const invitationListQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      status: z
        .enum(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "COMPLETED"])
        .optional(),
    })
    .strict(),
});