import { apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { AuditLog, User } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { ChangePasswordPayload, UpdateProfilePayload } from "./payloads";

export const usersApi = {
  me: () => apiGet<User>(endpoints.users.me),

  updateProfile: (payload: UpdateProfilePayload) => apiPatch<User>(endpoints.users.me, payload),

  changePassword: (payload: ChangePasswordPayload) =>
    apiPost<unknown>(endpoints.users.password, payload),

  /** Recent audit-log entries for the signed-in user. */
  activity: (params?: { page?: number; limit?: number }) =>
    apiGetPaginated<AuditLog>(endpoints.users.activity, {
      params: compactParams({ page: params?.page, limit: params?.limit }),
    }),
};

export default usersApi;