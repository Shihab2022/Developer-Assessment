"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { evaluationsApi, getErrorMessage, submissionsApi } from "@/lib/api";
import type { ListParams } from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import type { CreateSubmissionPayload, WrittenEvaluationPayload } from "@/lib/types";

/* ---------------------------------------------------------------- queries */

export function useSubmission(id: string | undefined) {
  return useQuery({
    queryKey: qk.submissions.detail(id ?? ""),
    queryFn: () => submissionsApi.byId(id!),
    enabled: Boolean(id),
  });
}

/** Written answers waiting for manual scoring (RECRUITER / ADMIN). */
export function usePendingEvaluations(params?: ListParams) {
  return useQuery({
    queryKey: qk.evaluations.pending(params),
    queryFn: () => evaluationsApi.pending(params),
    placeholderData: (previous) => previous,
  });
}

/* ---------------------------------------------------------------- mutations */

export function useCreateSubmission(attemptId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubmissionPayload) => submissionsApi.create(payload),
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: qk.submissions.detail(submission.id) });
      if (attemptId) {
        queryClient.invalidateQueries({ queryKey: qk.attempts.submissions(attemptId) });
      }
      toast.success("Submission received");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Runs the sandbox evaluation for a submission and refreshes related caches. */
export function useEvaluateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => submissionsApi.evaluate(id),
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: qk.submissions.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.attempts.all });
      queryClient.invalidateQueries({ queryKey: qk.results.all });
      toast.success("Evaluation complete");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Manually scores a written answer. */
export function useEvaluateWritten() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WrittenEvaluationPayload) => evaluationsApi.evaluateWritten(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      queryClient.invalidateQueries({ queryKey: qk.attempts.all });
      queryClient.invalidateQueries({ queryKey: qk.results.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.recruiter });
      toast.success("Score saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}