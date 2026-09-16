import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type {
  Assessment,
  AssessmentHistoryEntry,
  AssessmentInput,
  AssessmentProblem,
  Attempt,
  CandidateComparisonRow,
  Evaluation,
  Invitation,
  Result,
  Submission,
} from "@/lib/types";
import { endpoints } from "./endpoints";
import type {
  AssessmentListParams,
  AssessmentProblemPayload,
  AttemptListParams,
  CompareCandidatesParams,
  DuplicateAssessmentPayload,
  InvitationListParams,
  SubmissionListParams,
} from "./payloads";

export const assessmentsApi = {
  list: (params?: AssessmentListParams) =>
    apiGetPaginated<Assessment>(endpoints.assessments.list, {
      params: compactParams({ ...params }),
    }),

  byId: (id: string) => apiGet<Assessment>(endpoints.assessments.byId(id)),

  create: (payload: AssessmentInput) => apiPost<Assessment>(endpoints.assessments.create, payload),

  update: (id: string, payload: Partial<AssessmentInput>) =>
    apiPatch<Assessment>(endpoints.assessments.byId(id), payload),

  remove: (id: string) => apiDelete<unknown>(endpoints.assessments.byId(id)),

  /* ---- lifecycle ---- */

  publish: (id: string) => apiPost<Assessment>(endpoints.assessments.publish(id)),
  close: (id: string) => apiPost<Assessment>(endpoints.assessments.close(id)),
  archive: (id: string) => apiPost<Assessment>(endpoints.assessments.archive(id)),
  restore: (id: string) => apiPost<Assessment>(endpoints.assessments.restore(id)),

  duplicate: (id: string, payload?: DuplicateAssessmentPayload) =>
    apiPost<Assessment>(endpoints.assessments.duplicate(id), payload ?? {}),

  recalculateResults: (id: string) =>
    apiPost<Record<string, unknown>>(endpoints.assessments.recalculate(id)),

  history: (id: string) => apiGet<AssessmentHistoryEntry[]>(endpoints.assessments.history(id)),

  compareCandidates: (id: string, params: CompareCandidatesParams) =>
    apiGet<CandidateComparisonRow[]>(endpoints.assessments.compare(id), {
      params: compactParams({ ...params }),
    }),

  /* ---- attached problems ---- */

  problems: (id: string, params?: { page?: number; limit?: number; section?: string; isRequired?: boolean }) =>
    apiGetPaginated<AssessmentProblem>(endpoints.assessments.problems(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  addProblem: (id: string, payload: AssessmentProblemPayload & { problemId: string }) =>
    apiPost<AssessmentProblem>(endpoints.assessments.problems(id), payload),

  updateProblem: (id: string, problemId: string, payload: AssessmentProblemPayload) =>
    apiPatch<AssessmentProblem>(endpoints.assessments.problem(id, problemId), payload),

  removeProblem: (id: string, problemId: string) =>
    apiDelete<unknown>(endpoints.assessments.problem(id, problemId)),

  /* ---- related collections ---- */

  invitations: (id: string, params?: InvitationListParams) =>
    apiGetPaginated<Invitation>(endpoints.assessments.invitations(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  invite: (id: string, candidates: { email: string; expiresAt?: string }[]) =>
    apiPost<unknown>(endpoints.assessments.invitations(id), { candidates }),

  results: (id: string, params?: { page?: number; limit?: number }) =>
    apiGetPaginated<Result>(endpoints.assessments.results(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  submissions: (id: string, params?: SubmissionListParams) =>
    apiGetPaginated<Submission>(endpoints.assessments.submissions(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  evaluations: (id: string, params?: { page?: number; limit?: number; status?: string }) =>
    apiGetPaginated<Evaluation>(endpoints.assessments.evaluations(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  /* ---- candidate entry point ---- */

  startAttempt: (id: string) => apiPost<Attempt>(endpoints.assessments.startAttempt(id)),
};

export default assessmentsApi;