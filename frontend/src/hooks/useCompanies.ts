"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companiesApi, getErrorMessage, notesApi } from "@/lib/api";
import type {
  CandidateListParams,
  CreateCompanyPayload,
  NoteListParams,
  UpdateCompanyPayload,
  UpdateRecruitmentStatusPayload,
} from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import type { NoteInput } from "@/lib/types";

/* ---------------------------------------------------------------- companies */

export function useCompanies(params?: {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  return useQuery({
    queryKey: qk.companies.list(params),
    queryFn: () => companiesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: qk.companies.detail(id ?? ""),
    queryFn: () => companiesApi.byId(id!),
    enabled: Boolean(id),
  });
}

export function useCompanyMembers(id: string | undefined) {
  return useQuery({
    queryKey: qk.companies.members(id ?? ""),
    queryFn: () => companiesApi.members(id!),
    enabled: Boolean(id),
  });
}

export function useCompanyAnalytics(id: string | undefined) {
  return useQuery({
    queryKey: qk.companies.analytics(id ?? ""),
    queryFn: () => companiesApi.analytics(id!),
    enabled: Boolean(id),
  });
}

export function useCompanyReportSummary(id: string | undefined) {
  return useQuery({
    queryKey: qk.companies.reportSummary(id ?? ""),
    queryFn: () => companiesApi.reportSummary(id!),
    enabled: Boolean(id),
  });
}

export function useCompanyCandidates(companyId: string | undefined, params?: CandidateListParams) {
  return useQuery({
    queryKey: qk.companies.candidates(companyId ?? "", params),
    queryFn: () => companiesApi.candidates(companyId!, params),
    enabled: Boolean(companyId),
    placeholderData: (previous) => previous,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => companiesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.companies.all });
      toast.success("Company created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCompanyPayload) => companiesApi.update(id, payload),
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: qk.companies.all });
      queryClient.setQueryData(qk.companies.detail(id), company);
      toast.success("Company updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCandidateStatus(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      payload,
    }: {
      invitationId: string;
      payload: UpdateRecruitmentStatusPayload;
    }) => companiesApi.updateCandidateStatus(invitationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies", "candidates", companyId] });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.recruiter });
      toast.success("Candidate status updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/* ---------------------------------------------------------------- notes */

export function useCandidateNotes(candidateId: string | undefined, params?: NoteListParams) {
  return useQuery({
    queryKey: qk.notes.byCandidate(candidateId ?? "", params),
    queryFn: () => notesApi.byCandidate(candidateId!, params),
    enabled: Boolean(candidateId),
    placeholderData: (previous) => previous,
  });
}

export function useCreateNote(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NoteInput) => notesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", candidateId] });
      toast.success("Note added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateNote(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content, isPrivate }: { noteId: string; content: string; isPrivate: boolean }) =>
      notesApi.update(noteId, { content, isPrivate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", candidateId] });
      toast.success("Note updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteNote(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => notesApi.remove(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", candidateId] });
      toast.success("Note deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}