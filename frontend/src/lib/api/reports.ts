import { apiDownload, apiGet, apiGetPaginated } from "@/lib/api";
import { compactParams, downloadBlob } from "@/lib/utils";
import type { AssessmentAnalytics, AssessmentReport, CompanyReportSummary } from "@/lib/types";
import { endpoints } from "./endpoints";

export interface CsvDownloadParams {
  /** Applied only to client-side filename generation fallbacks. */
  assessmentTitle?: string;
}

export const reportsApi = {
  /** Full assessment report (stats, question performance, ranking). */
  assessmentReport: (assessmentId: string) =>
    apiGet<AssessmentReport>(endpoints.assessments.report(assessmentId)),

  /**
   * CSV export. The API returns `text/csv` with a Content-Disposition header,
   * so we stream it as a Blob and let the browser save it.
   */
  downloadAssessmentCsv: async (assessmentId: string, fallbackName = "assessment-report") => {
    const { blob, filename } = await apiDownload(endpoints.assessments.reportCsv(assessmentId));
    const safeName = (filename ?? `${fallbackName}.csv`).replace(/[/\\?%*:|"<>]/g, "-");
    downloadBlob(blob, safeName.endsWith(".csv") ? safeName : `${safeName}.csv`);
  },

  assessmentAnalytics: (assessmentId: string) =>
    apiGet<AssessmentAnalytics>(endpoints.assessments.analytics(assessmentId)),

  companyReports: (companyId: string, params?: { page?: number; limit?: number }) =>
    apiGetPaginated<Record<string, unknown>>(endpoints.companies.reports(companyId), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  companyReportSummary: (companyId: string) =>
    apiGet<CompanyReportSummary>(endpoints.companies.reportSummary(companyId)),
};

export default reportsApi;