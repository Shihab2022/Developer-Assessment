"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, problemsApi } from "@/lib/api";
import type { ProblemListParams } from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import type { ProblemInput } from "@/lib/types";

export function useProblems(params?: ProblemListParams) {
  return useQuery({
    queryKey: qk.problems.list(params),
    queryFn: () => problemsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useProblemSearch(q: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: qk.problems.search(q, params),
    queryFn: () => problemsApi.search(q, params),
    enabled: q.trim().length > 1,
    placeholderData: (previous) => previous,
  });
}

export function useProblem(id: string | undefined) {
  return useQuery({
    queryKey: qk.problems.detail(id ?? ""),
    queryFn: () => problemsApi.byId(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateProblems() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: qk.problems.all });
    queryClient.invalidateQueries({ queryKey: qk.dashboard.recruiter });
    queryClient.invalidateQueries({ queryKey: qk.admin.problems() });
  };
}

export function useCreateProblem() {
  const invalidate = useInvalidateProblems();
  return useMutation({
    mutationFn: (payload: ProblemInput) => problemsApi.create(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Problem created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateProblem(id: string) {
  const invalidate = useInvalidateProblems();
  return useMutation({
    mutationFn: (payload: Partial<ProblemInput>) => problemsApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Problem updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteProblem() {
  const invalidate = useInvalidateProblems();
  return useMutation({
    mutationFn: (id: string) => problemsApi.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success("Problem deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}