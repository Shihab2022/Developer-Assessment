import { QueryCache, QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { getErrorMessage, getErrorStatus } from "@/lib/api";

/**
 * Shared React Query client.
 *
 * We deliberately do not retry 4xx responses — the backend returns meaningful
 * messages and auth failures are already handled by the axios interceptor.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = getErrorStatus(error);
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Surface background refetch failures once, instead of silently dying.
        const status = getErrorStatus(error);
        if (status === 401 || status === 403) return;
        if (query.state.data !== undefined) {
          toast.error(getErrorMessage(error));
        }
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a fresh client so requests don't leak between users.
    return makeQueryClient();
  }
  browserQueryClient = browserQueryClient ?? makeQueryClient();
  return browserQueryClient;
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof AxiosError && error.response?.status === 401;
}
