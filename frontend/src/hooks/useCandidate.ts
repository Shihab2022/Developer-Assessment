"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, invitationsApi, resultsApi } from "@/lib/api";
import type { InvitationListParams, ListParams } from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

/* ---------------------------------------------------------------- invitations */

export function useMyInvitations(params?: InvitationListParams) {
  return useQuery({
    queryKey: qk.invitations.mine(params),
    queryFn: () => invitationsApi.mine(params),
    placeholderData: (previous) => previous,
  });
}

export function useResendInvitation() {
  return useMutation({
    mutationFn: (id: string) => invitationsApi.resend(id),
    onSuccess: () => toast.success("Invitation email re-sent"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApi.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.candidate });
      queryClient.invalidateQueries({ queryKey: qk.attempts.all });
      toast.success("Invitation accepted. You can now start the assessment.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.candidate });
      toast.success("Invitation declined");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/* ---------------------------------------------------------------- results */

/** Candidate results — the API only returns released results. */
export function useMyResults(params?: ListParams) {
  return useQuery({
    queryKey: qk.results.mine(params),
    queryFn: () => resultsApi.mine(params),
    placeholderData: (previous) => previous,
  });
}

export function useResult(id: string | undefined) {
  return useQuery({
    queryKey: qk.results.detail(id ?? ""),
    queryFn: () => resultsApi.byId(id!),
    enabled: Boolean(id),
  });
}

export function useResultSkills(id: string | undefined) {
  return useQuery({
    queryKey: qk.results.skills(id ?? ""),
    queryFn: () => resultsApi.skills(id!),
    enabled: Boolean(id),
  });
}