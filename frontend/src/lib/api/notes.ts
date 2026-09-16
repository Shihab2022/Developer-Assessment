import { apiDelete, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { Note, NoteInput, NoteUpdateInput } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { NoteListParams } from "./payloads";

export const notesApi = {
  /** Recruiters see public notes + their own private notes; admins see all. */
  byCandidate: (candidateId: string, params?: NoteListParams) =>
    apiGetPaginated<Note>(endpoints.notes.byCandidate(candidateId), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  create: (payload: NoteInput) => apiPost<Note>(endpoints.notes.create, payload),

  update: (noteId: string, payload: NoteUpdateInput) =>
    apiPatch<Note>(endpoints.notes.byId(noteId), payload),

  remove: (noteId: string) => apiDelete<unknown>(endpoints.notes.byId(noteId)),
};

export default notesApi;