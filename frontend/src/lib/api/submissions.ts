import { apiGet, apiPost } from "@/lib/api";
import type { CreateSubmissionPayload, EvaluateSubmissionResult, Submission } from "@/lib/types";
import { endpoints } from "./endpoints";

export const submissionsApi = {
  create: (payload: CreateSubmissionPayload) =>
    apiPost<Submission>(endpoints.submissions.create, payload),

  byId: (id: string) => apiGet<Submission>(endpoints.submissions.byId(id)),

  /** Trigger sandbox evaluation (RECRUITER / ADMIN). */
  evaluate: (id: string) => apiPost<EvaluateSubmissionResult>(endpoints.submissions.evaluate(id)),
};

export default submissionsApi;