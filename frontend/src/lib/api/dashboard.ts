import { apiGet } from "@/lib/api";
import type { CandidateDashboard, RecruiterDashboard } from "@/lib/types";
import { endpoints } from "./endpoints";

export const dashboardApi = {
  /** Available to RECRUITER and ADMIN. */
  recruiter: () => apiGet<RecruiterDashboard>(endpoints.dashboard.recruiter),

  candidate: () => apiGet<CandidateDashboard>(endpoints.dashboard.candidate),
};

export default dashboardApi;