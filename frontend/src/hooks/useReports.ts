"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, reportsApi } from "@/lib/api";
import { qk } from "@/lib/query/keys";

export function useCompanyReports(
  companyId: string | undefined,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: qk.companies.reports(companyId ?? "", params),
    queryFn: () => reportsApi.companyReports(companyId!, params),
    enabled: Boolean(companyId),
    placeholderData: (previous) => previous,
  });
}

export function useCompanyReportSummary(companyId: string | undefined) {
  return useQuery({
    queryKey: qk.companies.reportSummary(companyId ?? ""),
    queryFn: () => reportsApi.companyReportSummary(companyId!),
    enabled: Boolean(companyId),
  });
}

/**
 * Downloads the server-generated CSV report.
 * The API exposes CSV only — use the browser's print dialog for a PDF.
 */
export function useExportAssessmentCsv(assessmentId: string, assessmentTitle?: string) {
  return useMutation({
    mutationFn: () => reportsApi.downloadAssessmentCsv(assessmentId, assessmentTitle),
    onSuccess: () => toast.success("CSV report downloaded"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}