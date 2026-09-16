"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assessmentsApi, getErrorMessage, reportsApi } from "@/lib/api";
import type {
  AssessmentListParams,
  AssessmentProblemPayload,
  DuplicateAssessmentPayload,
  InvitationListParams,
  SubmissionListParams,
} from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import type { AssessmentInput } from "@/lib/types";

/* ---------------------------------------------------------------- queries */

export function useAssessments(params?: AssessmentListParams) {
  return useQuery({
    queryKey: qk.assessments.list(params),
    queryFn: () => assessmentsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery({
    queryKey: qk.assessments.detail(id ?? ""),
    queryFn: () => assessmentsApi.byId(id!),
    enabled: Boolean(id),
  });
}

export function useAssessmentProblems(
  id: string | undefined,
  params?: { page?: number; limit?: number; section?: string; isRequired?: boolean },
) {
  return useQuery({
    queryKey: qk.assessments.problems(id ?? "", params),
    queryFn: () => assessmentsApi.problems(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

export function useAssessmentHistory(id: string | undefined) {
  return useQuery({
    queryKey: qk.assessments.history(id ?? ""),
    queryFn: () => assessmentsApi.history(id!),
    enabled: Boolean(id),
  });
}

export function useAssessmentReport(id: string | undefined) {
  return useQuery({
    queryKey: qk.assessments.report(id ?? ""),
        queryFn: () => reportsApi.assessmentReport(id!),
    enabled: Boolean(id),
  });
}

export function useAssessmentAnalytics(id: string | undefined) {
  return useQuery({
    queryKey: qk.assessments.analytics(id ?? ""),
        queryFn: () => reportsApi.assessmentAnalytics(id!),
    enabled: Boolean(id),
  });
}

export function useCompareCandidates(id: string | undefined, candidateIds: string[]) {
  const key = candidateIds.join(",");
  return useQuery({
    queryKey: qk.assessments.compare(id ?? "", key),
    queryFn: () => assessmentsApi.compareCandidates(id!, { candidateIds: key }),
    enabled: Boolean(id) && candidateIds.length > 0,
  });
}

export function useAssessmentInvitations(id: string | undefined, params?: InvitationListParams) {
  return useQuery({
    queryKey: qk.assessments.invitations(id ?? "", params),
    queryFn: () => assessmentsApi.invitations(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

export function useAssessmentResults(id: string | undefined, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: qk.assessments.results(id ?? "", params),
    queryFn: () => assessmentsApi.results(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

export function useAssessmentSubmissions(id: string | undefined, params?: SubmissionListParams) {
  return useQuery({
    queryKey: qk.assessments.submissions(id ?? "", params),
    queryFn: () => assessmentsApi.submissions(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

export function useAssessmentEvaluations(
  id: string | undefined,
  params?: { page?: number; limit?: number; status?: string },
) {
  return useQuery({
    queryKey: qk.assessments.evaluations(id ?? "", params),
    queryFn: () => assessmentsApi.evaluations(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

/* ---------------------------------------------------------------- mutations */

/** Invalidates every cached view that depends on a given assessment. */
function useInvalidateAssessment() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: qk.assessments.all });
    if (id) queryClient.invalidateQueries({ queryKey: qk.assessments.detail(id) });
    queryClient.invalidateQueries({ queryKey: qk.dashboard.recruiter });
    queryClient.invalidateQueries({ queryKey: qk.admin.assessments() });
  };
}

export function useCreateAssessment() {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: (payload: AssessmentInput) => assessmentsApi.create(payload),
    onSuccess: (assessment) => {
      invalidate(assessment.id);
      toast.success("Assessment created as draft");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAssessment(id: string) {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: (payload: Partial<AssessmentInput>) => assessmentsApi.update(id, payload),
    onSuccess: () => {
      invalidate(id);
      toast.success("Assessment updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteAssessment() {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: (id: string) => assessmentsApi.remove(id),
    onSuccess: (_data, id) => {
      invalidate(id);
      toast.success("Assessment deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

type LifecycleAction = "publish" | "close" | "archive" | "restore";

const LIFECYCLE_CALL: Record<LifecycleAction, (id: string) => Promise<unknown>> = {
  publish: assessmentsApi.publish,
  close: assessmentsApi.close,
  archive: assessmentsApi.archive,
  restore: assessmentsApi.restore,
};

const LIFECYCLE_MESSAGE: Record<LifecycleAction, string> = {
  publish: "Assessment published. Candidates can now be invited.",
  close: "Assessment closed.",
  archive: "Assessment archived.",
  restore: "Assessment restored to draft.",
};

/** Single hook for the DRAFT → PUBLISHED → CLOSED → ARCHIVED lifecycle. */
export function useAssessmentLifecycle(id: string) {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: (action: LifecycleAction) => LIFECYCLE_CALL[action](id),
    onSuccess: (_data, action) => {
      invalidate(id);
      toast.success(LIFECYCLE_MESSAGE[action]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDuplicateAssessment() {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: DuplicateAssessmentPayload }) =>
      assessmentsApi.duplicate(id, payload),
    onSuccess: (copy) => {
      invalidate(copy.id);
      toast.success("Assessment duplicated as a new draft");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRecalculateResults(id: string) {
  const invalidate = useInvalidateAssessment();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => assessmentsApi.recalculateResults(id),
    onSuccess: () => {
      invalidate(id);
      queryClient.invalidateQueries({ queryKey: qk.results.all });
      toast.success("Results recalculated from saved answers and evaluations");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAddAssessmentProblem(id: string) {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: (payload: AssessmentProblemPayload & { problemId: string }) =>
      assessmentsApi.addProblem(id, payload),
    onSuccess: () => {
      invalidate(id);
      toast.success("Problem added to the assessment");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAssessmentProblem(id: string) {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: ({
      problemId,
      payload,
    }: {
      problemId: string;
      payload: AssessmentProblemPayload;
    }) => assessmentsApi.updateProblem(id, problemId, payload),
    onSuccess: () => {
      invalidate(id);
      toast.success("Problem settings saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveAssessmentProblem(id: string) {
  const invalidate = useInvalidateAssessment();
  return useMutation({
    mutationFn: (problemId: string) => assessmentsApi.removeProblem(id, problemId),
    onSuccess: () => {
      invalidate(id);
      toast.success("Problem removed from the assessment");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useInviteCandidates(id: string) {
  const invalidate = useInvalidateAssessment();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (candidates: { email: string; expiresAt?: string }[]) =>
      assessmentsApi.invite(id, candidates),
    onSuccess: (_data, candidates) => {
      invalidate(id);
      queryClient.invalidateQueries({ queryKey: qk.companies.all });
      toast.success(
        candidates.length === 1
          ? "Invitation sent"
          : `${candidates.length} invitations processed`,
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}