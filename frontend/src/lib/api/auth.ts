import { apiGet, apiPost } from "@/lib/api";
import type {
  AuthPayload,
  RefreshTokenPayload,
  RegisterPayload,
  RegisterResult,
  User,
} from "@/lib/types";
import { endpoints } from "./endpoints";

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiPost<RegisterResult>(endpoints.auth.register, payload),

  login: (payload: LoginPayload) => apiPost<AuthPayload>(endpoints.auth.login, payload),

  /** Confirms an email address using the token from the confirmation link. */
  verifyEmail: (token: string) =>
    apiPost<{ id: string; email: string; emailVerified: boolean }>(
      endpoints.auth.verifyEmail,
      { token },
    ),

  /** Re-sends the confirmation email (idempotent, never reveals the account). */
  resendVerification: (email: string) =>
    apiPost<{ sent: boolean }>(endpoints.auth.resendVerification, { email }),

  /** Token rotation: the previous refresh token is revoked by the backend. */
  refresh: (refreshToken: string) =>
    apiPost<RefreshTokenPayload>(endpoints.auth.refresh, { refreshToken }),

  logout: (refreshToken?: string | null) =>
    apiPost<unknown>(endpoints.auth.logout, refreshToken ? { refreshToken } : {}),

  me: () => apiGet<User>(endpoints.auth.me),
};

export default authApi;