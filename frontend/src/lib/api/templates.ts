import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { Assessment, AssessmentTemplate } from "@/lib/types";
import { endpoints } from "./endpoints";
import type {
  CreateAssessmentFromTemplatePayload,
  CreateTemplatePayload,
  ListParams,
  UpdateTemplatePayload,
} from "./payloads";

export const templatesApi = {
  list: (params?: ListParams & { companyId?: string }) =>
    apiGetPaginated<AssessmentTemplate>(endpoints.templates.list, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  byId: (id: string) => apiGet<AssessmentTemplate>(endpoints.templates.byId(id)),

  create: (payload: CreateTemplatePayload) =>
    apiPost<AssessmentTemplate>(endpoints.templates.create, payload),

  update: (id: string, payload: UpdateTemplatePayload) =>
    apiPatch<AssessmentTemplate>(endpoints.templates.byId(id), payload),

  remove: (id: string) => apiDelete<unknown>(endpoints.templates.byId(id)),

  /** Instantiates a new DRAFT assessment from the template. */
  use: (id: string, payload?: CreateAssessmentFromTemplatePayload) =>
    apiPost<Assessment>(endpoints.templates.use(id), payload ?? {}),
};

export default templatesApi;