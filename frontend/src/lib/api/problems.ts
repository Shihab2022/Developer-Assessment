import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { Problem, ProblemInput } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { ProblemListParams } from "./payloads";

export const problemsApi = {
  list: (params?: ProblemListParams) =>
    apiGetPaginated<Problem>(endpoints.problems.list, { params: compactParams({ ...params }) }),

  /** Keyword search (`GET /problems/search?q=`). */
  search: (q: string, params?: { page?: number; limit?: number }) =>
    apiGetPaginated<Problem>(endpoints.problems.search, {
      params: compactParams({ q, ...(params ?? {}) }),
    }),

  byId: (id: string) => apiGet<Problem>(endpoints.problems.byId(id)),

  create: (payload: ProblemInput) => apiPost<Problem>(endpoints.problems.create, payload),

  update: (id: string, payload: Partial<ProblemInput>) =>
    apiPatch<Problem>(endpoints.problems.byId(id), payload),

  remove: (id: string) => apiDelete<unknown>(endpoints.problems.byId(id)),
};

export default problemsApi;