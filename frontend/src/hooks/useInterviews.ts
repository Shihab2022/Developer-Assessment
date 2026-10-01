"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage, interviewsApi } from "@/lib/api";
import type { InterviewListParams, InterviewSessionListParams } from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import type {
  CreateInterviewPayload,
  CreateSessionLinkPayload,
  CustomQuestionPayload,
  UpdateInterviewPayload,
} from "@/lib/types";

/* ---------------------------------------------------------------- queries */

export function useInterviewTechnologies() {
  return useQuery({
    queryKey: qk.interviews.technologies,
    queryFn: () => interviewsApi.technologies(),
    staleTime: 30 * 60_000,
  });
}

export function useInterviews(params?: InterviewListParams) {
  return useQuery({
    queryKey: qk.interviews.list(params),
    queryFn: () => interviewsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useInterview(id: string | undefined) {
  return useQuery({
    queryKey: qk.interviews.detail(id ?? ""),
    queryFn: () => interviewsApi.byId(id!),
    enabled: Boolean(id),
  });
}

export function useInterviewSessions(id: string | undefined, params?: InterviewSessionListParams) {
  return useQuery({
    queryKey: qk.interviews.sessions(id ?? "", params),
    queryFn: () => interviewsApi.sessions(id!, params),
    enabled: Boolean(id),
    placeholderData: (previous) => previous,
  });
}

export function useInterviewSessionReport(id: string | undefined, sessionId: string | undefined) {
  return useQuery({
    queryKey: qk.interviews.session(id ?? "", sessionId ?? ""),
    queryFn: () => interviewsApi.sessionReport(id!, sessionId!),
    enabled: Boolean(id) && Boolean(sessionId),
    retry: false,
  });
}

export function useInterviewReport(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.interviews.report(id ?? ""),
    queryFn: () => interviewsApi.report(id!),
    enabled: Boolean(id) && enabled,
  });
}

/* -------------------------------------------------------------- mutations */

export function useCreateInterview() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: CreateInterviewPayload) => interviewsApi.create(payload),
    onSuccess: (interview) => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.all });
      toast.success("Interview created — publish it to share the candidate link.");
      router.push(`/recruiter/interviews/${interview.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateInterview(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateInterviewPayload) => interviewsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.interviews.all });
      toast.success("Interview updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useInterviewLifecycle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "publish" | "close") =>
      action === "publish" ? interviewsApi.publish(id) : interviewsApi.close(id),
    onSuccess: (interview) => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.all });
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      toast.success(
        interview.status === "ACTIVE"
          ? "Published — share the candidate link below"
          : "Interview closed to new candidates",
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: string) => interviewsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.all });
      toast.success("Interview archived");
      router.push("/recruiter/interviews");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/* ------------------------------------------------------------- questions */

/** Redraws the random sample from the technology question bank (requirement 6). */
export function useRegenerateQuestions(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { questionCount?: number; keepCustomQuestions?: boolean }) =>
      interviewsApi.regenerateQuestions(id, payload),
    onSuccess: (questions) => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      toast.success(`${questions.length} questions redrawn from the bank`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAddQuestion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomQuestionPayload) => interviewsApi.addQuestion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      toast.success("Custom question added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateQuestion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: string; payload: Partial<CustomQuestionPayload> }) =>
      interviewsApi.updateQuestion(id, questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      toast.success("Question updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveQuestion(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => interviewsApi.removeQuestion(id, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      toast.success("Question removed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/* -------------------------------------------------------------- sessions */

/** Per-candidate invite link (requirement 4 — the link opens the camera). */
export function useCreateSessionLink(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSessionLinkPayload) => interviewsApi.createSessionLink(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.sessions(id) });
      toast.success(result.reused ? "Existing link reused" : "Candidate link created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useReReviewSession(id: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => interviewsApi.reReview(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.session(id, sessionId) });
      queryClient.invalidateQueries({ queryKey: qk.interviews.report(id) });
      queryClient.invalidateQueries({ queryKey: qk.interviews.all });
      toast.success("AI review re-run with the latest engine");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

