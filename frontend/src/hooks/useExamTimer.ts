"use client";

import { useEffect, useState } from "react";
import { formatClock } from "@/store/exams";

/**
 * Countdown for an in-progress exam. The browser clock is fine for a
 * client-side MCQ attempt: the persisted `expiresAt` is authoritative, so
 * reloads never grant extra time, and expiry is reported through `onExpire`.
 */
export function useExamTimer(expiresAt: string | undefined, onExpire?: () => void) {
  const [remaining, setRemaining] = useState<number>(() =>
    expiresAt ? Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0,
  );

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();

    const tick = () => {
      const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) onExpire?.();
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
    // `onExpire` is expected to be stable (a store submit action).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return { remaining, label: formatClock(remaining), expired: remaining === 0 };
}

export default useExamTimer;