import { z } from "zod";

export const notificationQuerySchema = z.object({
  query: z.object({ page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).optional(), status: z.enum(["UNREAD", "READ"]).optional() }).strict(),
});

export const notificationParamsSchema = z.object({ params: z.object({ id: z.string().uuid("Invalid notification id") }) });
