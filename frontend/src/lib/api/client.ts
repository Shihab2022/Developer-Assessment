import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";
import type { ApiEnvelope, ApiErrorField, Meta, Paginated } from "../types";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

/** Broadcast when the session is no longer recoverable (consumed by providers). */
export const SESSION_EXPIRED_EVENT = "devassess:session-expired";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 45_000,
});

/* ------------------------------------------------------------------ auth */

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Endpoints that must never trigger a refresh retry (would loop). */
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh-token"];

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    // Uses a bare axios call so the interceptors do not recurse.
    const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${API_BASE_URL}/auth/refresh-token`,
      { refreshToken },
      { timeout: 20_000 },
    );
    const data = res.data?.data;
    if (data?.accessToken) {
      setTokens(data.accessToken, data.refreshToken ?? refreshToken);
      return data.accessToken;
    }
    clear();
    return null;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? "";
    const isAuthCall = AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      // Single-flight: concurrent 401s share one refresh round-trip.
      refreshPromise = refreshPromise ?? refreshAccessToken().finally(() => (refreshPromise = null));
      const token = await refreshPromise;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      }
      useAuthStore.getState().clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
    }
    return Promise.reject(error);
  },
);

/* ------------------------------------------------------------------ requests */

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiEnvelope<T>>(config);
  return response.data?.data as T;
}

export function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: "GET", url });
}

export function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: "POST", url, data });
}

export function apiPatch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: "PATCH", url, data });
}

export function apiPut<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: "PUT", url, data });
}

export function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ ...config, method: "DELETE", url });
}

const EMPTY_META: Meta = { page: 1, limit: 10, total: 0, totalPages: 1 };

/** GET an endpoint whose response carries `data` + `meta`. */
export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<Paginated<T>> {
  const response = await api.request<ApiEnvelope<T[]>>({ ...config, method: "GET", url });
  return {
    data: response.data?.data ?? [],
    meta: response.data?.meta ?? EMPTY_META,
  };
}

/** POST/PATCH an endpoint whose response carries `data` + `meta`. */
export async function apiMutatePaginated<T>(
  method: "POST" | "PATCH" | "PUT",
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<Paginated<T>> {
  const response = await api.request<ApiEnvelope<T[]>>({ ...config, method, url, data });
  return {
    data: response.data?.data ?? [],
    meta: response.data?.meta ?? EMPTY_META,
  };
}

/** Fetch a binary/text response (used by the CSV report export). */
export async function apiDownload(
  url: string,
  config?: AxiosRequestConfig,
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await api.request<Blob>({
    ...config,
    method: config?.method ?? "GET",
    url,
    responseType: "blob",
  });
  const disposition = response.headers?.["content-disposition"] as string | undefined;
  let filename: string | null = null;
  if (disposition) {
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    const plain = /filename="?([^";]+)"?/i.exec(disposition);
    filename = decodeURIComponent(utf8?.[1] ?? plain?.[1] ?? "") || null;
  }
  return { blob: response.data, filename };
}

/* ------------------------------------------------------------------ errors */

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

function getErrorFields(error: unknown): ApiErrorField[] | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as ApiEnvelope<unknown> | undefined;
  return Array.isArray(data?.errors) ? data.errors : undefined;
}

/** Field-keyed validation errors, for mapping 422 responses onto forms. */
export function getFieldErrors(error: unknown): Record<string, string> {
  const fields = getErrorFields(error);
  if (!fields?.length) return {};
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (field.field) result[field.field] = field.message;
  }
  return result;
}

/** Human-friendly message derived from the backend envelope. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const fields = getErrorFields(error);
    if (fields?.length) {
      return fields
        .map((field) => (field.field ? `${field.field}: ${field.message}` : field.message))
        .join(" • ");
    }
    const data = error.response?.data as ApiEnvelope<unknown> | undefined;
    if (data?.message) return data.message;

    switch (error.response?.status) {
      case 400:
        return "The request was rejected. Please review the values and try again.";
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource could not be found.";
      case 409:
        return "That change conflicts with the current state of the record.";
      case 422:
        return "Some fields are invalid. Please correct them and retry.";
      case 429:
        return "Too many requests. Please wait a moment before trying again.";
      case 500:
      case 502:
      case 503:
        return "The API server reported an internal error. Please try again shortly.";
      default:
        break;
    }
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the API server. Is the backend running?";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export default api;

