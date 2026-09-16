"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, getErrorMessage } from "@/lib/api";
import type {
  AuditLogParams,
  ListParams,
  PaymentListParams,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
} from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";

/* ---------------------------------------------------------------- queries */

export function useAdminStats() {
  return useQuery({
    queryKey: qk.admin.stats,
    queryFn: () => adminApi.dashboardStats(),
  });
}

export function useAdminUsers(params?: ListParams & { role?: string }) {
  return useQuery({
    queryKey: qk.admin.users(params),
    queryFn: () => adminApi.users(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: qk.admin.user(id ?? ""),
    queryFn: () => adminApi.user(id!),
    enabled: Boolean(id),
  });
}

export function useAdminCompanies(params?: ListParams) {
  return useQuery({
    queryKey: qk.admin.companies(params),
    queryFn: () => adminApi.companies(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminAssessments(params?: ListParams & { companyId?: string }) {
  return useQuery({
    queryKey: qk.admin.assessments(params),
    queryFn: () => adminApi.assessments(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminProblems(params?: ListParams & { type?: string; difficulty?: string }) {
  return useQuery({
    queryKey: qk.admin.problems(params),
    queryFn: () => adminApi.problems(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminPayments(params?: PaymentListParams) {
  return useQuery({
    queryKey: qk.admin.payments(params),
    queryFn: () => adminApi.payments(params),
    placeholderData: (previous) => previous,
  });
}

export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: qk.admin.auditLogs(params),
    queryFn: () => adminApi.auditLogs(params),
    placeholderData: (previous) => previous,
  });
}

/* ---------------------------------------------------------------- mutations */

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserStatusPayload }) =>
      adminApi.updateUserStatus(id, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(`${user.name} is now ${user.status.toLowerCase()}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRolePayload }) =>
      adminApi.updateUserRole(id, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(`${user.name} is now a ${user.role.toLowerCase()}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}