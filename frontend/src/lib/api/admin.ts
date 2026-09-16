import { apiGet, apiGetPaginated, apiPatch } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type {
  AdminStats,
  AdminUserRow,
  Assessment,
  AuditLog,
  Company,
  Payment,
  Problem,
  User,
} from "@/lib/types";
import { endpoints } from "./endpoints";
import type {
  AuditLogParams,
  ListParams,
  PaymentListParams,
  UpdateUserRolePayload,
  UpdateUserStatusPayload,
} from "./payloads";

export const adminApi = {
  /* ---- platform stats ---- */

  dashboardStats: () => apiGet<AdminStats>(endpoints.admin.dashboardStats),

  /* ---- users ---- */

  users: (params?: ListParams & { role?: string }) =>
    apiGetPaginated<AdminUserRow>(endpoints.admin.users, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  user: (id: string) => apiGet<User>(endpoints.admin.user(id)),

  updateUserStatus: (id: string, payload: UpdateUserStatusPayload) =>
    apiPatch<User>(endpoints.admin.userStatus(id), payload),

  updateUserRole: (id: string, payload: UpdateUserRolePayload) =>
    apiPatch<User>(endpoints.admin.userRole(id), payload),

  /* ---- companies (includes soft-deleted) ---- */

  companies: (params?: ListParams) =>
    apiGetPaginated<Company>(endpoints.admin.companies, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  /* ---- assessments ---- */

  assessments: (params?: ListParams & { companyId?: string }) =>
    apiGetPaginated<Assessment>(endpoints.admin.assessments, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  /* ---- problems ---- */

  problems: (params?: ListParams & { type?: string; difficulty?: string }) =>
    apiGetPaginated<Problem>(endpoints.admin.problems, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  /* ---- payments ---- */

  payments: (params?: PaymentListParams) =>
    apiGetPaginated<Payment>(endpoints.admin.payments, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  /* ---- audit trail ---- */

  auditLogs: (params?: AuditLogParams) =>
    apiGetPaginated<AuditLog>(endpoints.admin.auditLogs, {
      params: compactParams({ ...(params ?? {}) }),
    }),
};

export default adminApi;