"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { attemptsApi } from "@/lib/api";
import type { AntiCheatEventType } from "@/lib/types";

interface Options {
  /** Only monitor while the attempt is actually in progress. */
  enabled: boolean;
  /** Mirrors `Assessment.antiCheatingEnabled`. */
  antiCheatingEnabled?: boolean;
}

export interface AntiCheatState {
  /** Count of events reported during this session. */
  reportedCount: number;
  lastEvent: AntiCheatEventType | null;
  /** Ask the browser for fullscreen (helps prevent window switching). */
  requestFullscreen: () => Promise<void>;
}

/**
 * Reports proctoring signals to `POST /attempts/:id/anti-cheating-events`.
 *
 * Only the event types the API supports are emitted; the backend stores the IP,
 * user agent and timestamps and computes the risk score for reviewers.
 */
export function useAntiCheatingMonitor(attemptId: string, options: Options): AntiCheatState {
  const { enabled, antiCheatingEnabled = true } = options;
  const active = enabled && antiCheatingEnabled && Boolean(attemptId);

  const [reportedCount, setReportedCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<AntiCheatEventType | null>(null);
  const throttled = useRef<Record<string, number>>({});

  const report = useCallback(
    (eventType: AntiCheatEventType, metadata?: Record<string, unknown>) => {
      if (!active) return;
      // Throttle noisy events (copy/paste bursts) to 1 per 2s per type.
      const now = Date.now();
      const key = eventType;
      if (throttled.current[key] && now - throttled.current[key]! < 2000) return;
      throttled.current[key] = now;

      setReportedCount((count) => count + 1);
      setLastEvent(eventType);
      attemptsApi
        .reportAntiCheatEvent(attemptId, { eventType, metadata })
        .catch(() => {
          // Never surface proctoring failures to the candidate.
        });
    },
    [active, attemptId],
  );

  useEffect(() => {
    if (!active || typeof document === "undefined") return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        report("TAB_SWITCH", { hiddenAt: new Date().toISOString() });
      } else {
        report("WINDOW_FOCUS");
      }
    };
    const onBlur = () => report("WINDOW_BLUR");
    const onCopy = () => report("COPY");
    const onPaste = () => report("PASTE");
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) report("FULLSCREEN_EXIT");
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [active, report]);

  const requestFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      if (!document.fullscreenElement && element.requestFullscreen) {
        await element.requestFullscreen();
      }
    } catch {
      // Browsers may reject (user gesture required) — ignore.
    }
  }, []);

  return { reportedCount, lastEvent, requestFullscreen };
}