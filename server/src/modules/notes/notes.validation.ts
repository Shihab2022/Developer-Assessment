import { z } from "zod";

export const createNoteSchema = z.object({
  body: z.object({
    candidateId: z.string().uuid(),
    assessmentId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    content: z.string().min(1).max(5000),
    isPrivate: z.boolean().optional(),
  }).strict(),
});

export const updateNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000).optional(),
    isPrivate: z.boolean().optional(),
  }).strict().refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided" }),
});

export const noteParamsSchema = z.object({ params: z.object({ noteId: z.string().uuid("Invalid note id") }) });

export const candidateNotesQuerySchema = z.object({
  params: z.object({ candidateId: z.string().uuid("Invalid candidate id") }),
  query: z.object({ assessmentId: z.string().uuid().optional(), page: z.coerce.number().int().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).optional() }).strict(),
});
