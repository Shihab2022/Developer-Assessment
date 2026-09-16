import { apiGetPaginated, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { Evaluation, WrittenEvaluationPayload } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { ListParams } from "./payloads";

export const evaluationsApi = {
  /** Written answers still awaiting manual scoring. */
  pending: (params?: ListParams) =>
    apiGetPaginated<Evaluation>(endpoints.evaluations.pending, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  /** Manually score a written answer (RECRUITER / ADMIN). */
  evaluateWritten: (payload: WrittenEvaluationPayload) =>
    apiPost<Evaluation>(endpoints.evaluations.written, payload),
};

export default evaluationsApi;