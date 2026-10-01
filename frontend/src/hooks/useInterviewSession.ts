"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, interviewSessionApi } from "@/lib/api";
import { qk } from "@/lib/query/keys";
import type {
  ReportViolationPayload,
  StartSessionPayload,
  SubmitAnswerPayload,
} from "@/lib/types";

/** Pre-flight details shown before the candidate is asked for camera access. */
export function usePublicInterviewInfo(token: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.interviews.publicInfo(token ?? ""),
    queryFn: () => interviewSessionApi.info(token!),
    enabled: Boolean(token) && options?.enabled !== false,
    retry: false,
  });
}

/** Starts (or resumes) the interview and returns the served questions. */
export function useStartInterviewSession(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartSessionPayload) => interviewSessionApi.start(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.publicInfo(token) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSaveInterviewAnswer(token: string) {
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: string; payload: SubmitAnswerPayload }) =>
      interviewSessionApi.saveAnswer(token, questionId, payload),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Reports a proctoring signal. When the server terminates the session the
 * callback fires so the runner can stop immediately (requirements 8-10).
 */
export function useReportInterviewViolation(
  token: string,
  options?: { onTerminated?: (reason: string) => void },
) {
  return useMutation({
    mutationFn: (payload: ReportViolationPayload) =>
      interviewSessionApi.reportViolation(token, payload),
    onSuccess: (result) => {
      if (result.terminated) {
        options?.onTerminated?.(
          result.reason ?? result.terminationReason ?? "The interview was terminated",
        );
      }
    },
    // Proctoring errors must never be surfaced to the candidate.
    onError: () => undefined,
  });
}

export function useSubmitInterview(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: "CANDIDATE_SUBMIT" | "TIME_EXPIRED" | "PROCTORING") =>
      interviewSessionApi.submit(token, reason ?? "CANDIDATE_SUBMIT"),
    onSuccess: (result) => {
      queryClient.setQueryData(qk.interviews.result(token), result);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useInterviewResult(token: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: qk.interviews.result(token ?? ""),
    queryFn: () => interviewSessionApi.result(token!),
    enabled: Boolean(token) && options?.enabled !== false,
    retry: false,
  });
}
