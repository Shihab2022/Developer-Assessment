import { apiGet, apiGetPaginated } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { Result, SkillBreakdown } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { ListParams } from "./payloads";

export const resultsApi = {
  byId: (id: string) => apiGet<Result>(endpoints.results.byId(id)),

  /** Only released results are returned to candidates. */
  mine: (params?: ListParams) =>
    apiGetPaginated<Result>(endpoints.results.mine, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  skills: (id: string) => apiGet<SkillBreakdown>(endpoints.results.skills(id)),
};

export default resultsApi;