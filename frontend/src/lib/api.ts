import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/** Axios instance with JWT auth header + automatic refresh-token rotation */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshingPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
    const data = res.data?.data;
    const accessToken: string | undefined = data?.accessToken;
    const nextRefresh: string | undefined = data?.refreshToken;
    if (accessToken) {
      setTokens(accessToken, nextRefresh ?? refreshToken);
      return accessToken;
    }
    clear();
    return null;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/login") || url.includes("/auth/refresh-token") || url.includes("/auth/register");
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshingPromise =
        refreshingPromise ?? refreshAccessToken().finally(() => (refreshingPromise = null));
      const token = await refreshingPromise;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Human-friendly error message from the backend envelope */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: { field?: string; message: string }[] }
      | undefined;
    if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join(" • ");
    }
    if (data?.message) return data.message;
    if (error.code === "ERR_NETWORK") return "Cannot reach the API server. Is the backend running?";
    return error.message;
  }
  return "Something went wrong";
}

export default api;
