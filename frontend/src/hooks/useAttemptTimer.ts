"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { attemptsApi } from "@/lib/api";
import { qk } from "@/lib/query/keys";
import type { AttemptStatus } from "@/lib/types";
import { useTicker } from "./useUi";

const TERMINAL_STATUSES: AttemptStatus[] = [
  "SUBMITTED",
  "AUTO_SUBMITTED",
  "EVALUATING",
  "COMPLETED",
  "EXPIRED",
];

/**
 * Server-authoritative countdown for an attempt.
 *
 * The backend is the single source of truth for time (the client clock is never
 * trusted). We poll `GET /attempts/:id/time` and tick locally between polls,
 * anchored to the *server's* remaining seconds so client clock skew is ignored.
 */
export function useAttemptTimer(attemptId: string, enabled = true) {
  const query = useQuery({
    queryKey: qk.attempts.time(attemptId),
    queryFn: () => attemptsApi.time(attemptId),
    enabled: enabled && Boolean(attemptId),
    // Re-sync with the server periodically; the local ticker keeps the UI smooth.
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    staleTime: 5_000,
  });

  const server = query.data;
  const now = useTicker(enabled);

  const [anchor, setAnchor] = useState<{ remaining: number; at: number } | null>(null);

  useEffect(() => {
    if (!server) return;
    const isTerminal = TERMINAL_STATUSES.includes(server.status);
    const remaining = isTerminal ? 0 : Math.max(0, server.remainingTimeSeconds ?? 0);
    setAnchor({ remaining, at: Date.now() });
  }, [server, query.dataUpdatedAt]);

  const remainingSeconds = useMemo(() => {
    if (!anchor) return null;
    if (anchor.remaining <= 0) return 0;
    const elapsed = (now - anchor.at) / 1000;
    return Math.max(0, Math.round(anchor.remaining - elapsed));
  }, [anchor, now]);

  const status = server?.status;
  const isTerminal = status ? TERMINAL_STATUSES.includes(status) : false;
  const isExpired = remainingSeconds !== null && remainingSeconds <= 0;
  const isRunning = Boolean(status === "IN_PROGRESS" && !isExpired);

  return {
    /** Seconds left, or null until the first server sync resolves. */
    remainingSeconds,
    status,
    startedAt: server?.startedAt ?? null,
    expiresAt: server?.expiresAt ?? null,
    submittedAt: server?.submittedAt ?? null,
    serverTime: server?.serverTime ?? null,
    isRunning,
    isTerminal,
    isExpired,
    /** True when under 20% or 5 minutes remain — used for the "time low" state. */
    isLowTime: remainingSeconds !== null && remainingSeconds <= 300,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}