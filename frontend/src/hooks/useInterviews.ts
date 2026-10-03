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
  InterviewInviteCandidatesPayload,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.interviews.all });
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
    mutationFn: ({
      questionId,
      payload,
    }: {
      questionId: string;
      payload: Partial<CustomQuestionPayload>;
    }) => interviewsApi.updateQuestion(id, questionId, payload),
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
    mutationFn: (payload: CreateSessionLinkPayload) =>
      interviewsApi.createSessionLink(id, payload),
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


/* --------------------------------------------------------------- bank questions */

/** Browses the built-in bank so the org can cherry-pick extra questions (req 6). */
export function useInterviewBank(technology: string | undefined, q = "", enabled = true) {
  return useQuery({
    queryKey: qk.interviews.bank(technology ?? "", q),
    queryFn: () => interviewsApi.bank({ technology: technology!, q: q || undefined }),
    enabled: Boolean(technology) && enabled,
    staleTime: 5 * 60_000,
  });
}

/** Existing platform candidates (people who already sat other exams). */
export function useInterviewCandidates(q = "", enabled = true) {
  return useQuery({
    queryKey: qk.interviews.candidates(q),
    queryFn: () => interviewsApi.candidates({ q: q || undefined, limit: 25 }),
    enabled,
    staleTime: 30_000,
  });
}

export function useAddBankQuestions(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => interviewsApi.addFromBank(id, keys),
    onSuccess: (questions) => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      toast.success(`${questions.length} question(s) added from the bank`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/* -------------------------------------------------------------------- invites */

/** Sends personal, secured interview links (the invitation email carries them). */
export function useInviteToInterview(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InterviewInviteCandidatesPayload) =>
      interviewsApi.invite(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.sessions(id) });
      queryClient.invalidateQueries({ queryKey: qk.interviews.detail(id) });
      queryClient.invalidateQueries({ queryKey: qk.interviews.all });
      if (result.emailed > 0) {
        toast.success(`Invited ${result.invited} candidate(s) — ${result.emailed} email(s) sent`);
      } else {
        toast.info(`Invited ${result.invited} candidate(s). Email is off — copy the links below.`);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useResendInterviewInvite(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => interviewsApi.resendInvite(id, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.interviews.sessions(id) });
      toast.success("Invitation email sent again");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

