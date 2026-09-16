import { apiGet, apiPost } from "@/lib/api";
import type { AuthPayload, RefreshTokenPayload, RegisterPayload, User } from "@/lib/types";
import { endpoints } from "./endpoints";

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) => apiPost<AuthPayload>(endpoints.auth.register, payload),

  login: (payload: LoginPayload) => apiPost<AuthPayload>(endpoints.auth.login, payload),

  /** Token rotation: the previous refresh token is revoked by the backend. */
  refresh: (refreshToken: string) =>
    apiPost<RefreshTokenPayload>(endpoints.auth.refresh, { refreshToken }),

  logout: (refreshToken?: string | null) =>
    apiPost<unknown>(endpoints.auth.logout, refreshToken ? { refreshToken } : {}),

  me: () => apiGet<User>(endpoints.auth.me),
};

export default authApi;