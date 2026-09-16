import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type {
  Company,
  CompanyAnalytics,
  CompanyCandidateRow,
  CompanyMember,
  CompanyReportSummary,
} from "@/lib/types";
import { endpoints } from "./endpoints";
import type {
  CandidateListParams,
  CreateCompanyPayload,
  UpdateCompanyPayload,
  UpdateRecruitmentStatusPayload,
} from "./payloads";

export const companiesApi = {
  list: (params?: { page?: number; limit?: number; q?: string; sortBy?: string; sortOrder?: string }) =>
    apiGetPaginated<Company>(endpoints.companies.list, { params: compactParams(params ?? {}) }),

  create: (payload: CreateCompanyPayload) => apiPost<Company>(endpoints.companies.create, payload),

  byId: (id: string) => apiGet<Company>(endpoints.companies.byId(id)),

  update: (id: string, payload: UpdateCompanyPayload) =>
    apiPatch<Company>(endpoints.companies.byId(id), payload),

  remove: (id: string) => apiDelete<unknown>(endpoints.companies.byId(id)),

  members: (id: string) => apiGet<CompanyMember[]>(endpoints.companies.members(id)),

  reports: (id: string, params?: { page?: number; limit?: number }) =>
    apiGetPaginated<Record<string, unknown>>(endpoints.companies.reports(id), {
      params: compactParams(params ?? {}),
    }),

  reportSummary: (id: string) => apiGet<CompanyReportSummary>(endpoints.companies.reportSummary(id)),

  analytics: (id: string) => apiGet<CompanyAnalytics>(endpoints.companies.analytics(id)),

  candidates: (companyId: string, params?: CandidateListParams) =>
    apiGetPaginated<CompanyCandidateRow>(endpoints.companies.candidates(companyId), {
      params: compactParams({ ...params }),
    }),

  /** Updates the hiring pipeline status by *invitation* id. */
  updateCandidateStatus: (invitationId: string, payload: UpdateRecruitmentStatusPayload) =>
    apiPatch<unknown>(endpoints.companies.candidateStatus(invitationId), payload),
};

export default companiesApi;