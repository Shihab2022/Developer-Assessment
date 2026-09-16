"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assessmentsApi, attemptsApi, getErrorMessage } from "@/lib/api";
import type { AttemptListParams, ListParams } from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import type { SaveAnswerPayload } from "@/lib/types";

/* ---------------------------------------------------------------- queries */

export function useMyAttempts(params?: AttemptListParams) {
  return useQuery({
    queryKey: qk.attempts.mine(params),
    queryFn: () => attemptsApi.mine(params),
    placeholderData: (previous) => previous,
  });
}

export function useAttempt(id: string | undefined) {
  return useQuery({
    queryKey: qk.attempts.detail(id ?? ""),
    queryFn: () => attemptsApi.byId(id!),
    enabled: Boolean(id),
  });
}

export function useAttemptQuestions(id: string | undefined) {
  return useQuery({
    queryKey: qk.attempts.questions(id ?? ""),
    queryFn: () => attemptsApi.questions(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  });
}

export function useAttemptSubmissions(id: string | undefined, params?: ListParams) {
  return useQuery({
    queryKey: qk.attempts.submissions(id ?? ""),
    queryFn: () => attemptsApi.submissions(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

export function useAttemptEvaluations(id: string | undefined) {
  return useQuery({
    queryKey: qk.attempts.evaluations(id ?? ""),
    queryFn: () => attemptsApi.evaluations(id!),
    enabled: Boolean(id),
  });
}

export function useAntiCheatingReport(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.attempts.antiCheatReport(id ?? ""),
    queryFn: () => attemptsApi.antiCheatingReport(id!),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}

export function useAntiCheatingEvents(id: string | undefined, params?: ListParams) {
  return useQuery({
    queryKey: qk.attempts.antiCheatEvents(id ?? "", params),
    queryFn: () => attemptsApi.antiCheatingEvents(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

/* ---------------------------------------------------------------- mutations */

/** Starts (or resumes) an attempt and navigates to the runner. */
export function useStartAttempt(assessmentId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => assessmentsApi.startAttempt(assessmentId),
    onSuccess: (attempt) => {
      queryClient.invalidateQueries({ queryKey: qk.attempts.all });
      queryClient.invalidateQueries({ queryKey: qk.results.all });
      router.push(`/candidate/attempts/${attempt.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSaveAnswer(attemptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveAnswerPayload) => attemptsApi.saveAnswer(attemptId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.attempts.detail(attemptId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAnswer(attemptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ answerId, payload }: { answerId: string; payload: Partial<SaveAnswerPayload> }) =>
      attemptsApi.updateAnswer(attemptId, answerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.attempts.detail(attemptId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Submits the attempt and triggers automatic evaluation + result calculation. */
export function useSubmitAttempt(attemptId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => attemptsApi.submit(attemptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.attempts.all });
      queryClient.invalidateQueries({ queryKey: qk.results.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.candidate });
      toast.success("Attempt submitted. Your answers were saved.");
      router.replace(`/candidate/attempts/${attemptId}/submitted`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}