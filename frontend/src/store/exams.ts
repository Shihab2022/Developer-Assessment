import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { TechnologyId } from "@/lib/question-banks/types";
import { gradeAttempt, type GradeResult } from "@/lib/question-banks/grading";
import type { QuestionBank } from "@/lib/question-banks/types";

/**
 * Technology-exam attempts.
 *
 * The MCQ banks ship as JSON, so for now attempts live in the browser instead
 * of the assessment database: the paper (question ids + a seed) is persisted,
 * answers are graded against the bank at submit time, and the result page
 * re-derives the score from the stored attempt. Swapping this store for the
 * REST attempts API later only touches this file.
 */

export const PASS_PERCENT = 60;

export interface ExamAttemptConfig {
  count: number;
  durationMinutes: number;
  difficulty: string;
  topics: string[];
  shuffleOptions: boolean;
}

export type ExamAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";

export interface ExamAttempt {
  id: string;
  technology: TechnologyId;
  technologyLabel: string;
  config: ExamAttemptConfig;
  seed: number;
  questionIds: string[];
  optionOrders: Record<string, string[]>;
  startedAt: string;
  expiresAt: string;
  status: ExamAttemptStatus;
  answers: Record<string, string>;
  flagged: string[];
  submittedAt?: string;
}

export interface StartExamInput {
  technology: TechnologyId;
  technologyLabel: string;
  config: ExamAttemptConfig;
  plan: { questionIds: string[]; optionOrders: Record<string, string[]> };
  seed: number;
}

interface ExamsState {
  attempts: ExamAttempt[];
  start: (input: StartExamInput) => ExamAttempt;
  saveAnswer: (attemptId: string, questionId: string, optionId: string) => void;
  toggleFlag: (attemptId: string, questionId: string) => void;
  submit: (attemptId: string, status?: ExamAttemptStatus) => void;
  remove: (attemptId: string) => void;
}

function createId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) return cryptoRef.randomUUID();
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const useExamsStore = create<ExamsState>()(
  persist(
    (set) => ({
      attempts: [],

      start: (input) => {
        const now = Date.now();
        const attempt: ExamAttempt = {
          id: createId(),
          technology: input.technology,
          technologyLabel: input.technologyLabel,
          config: input.config,
          seed: input.seed,
          questionIds: input.plan.questionIds,
          optionOrders: input.plan.optionOrders,
          startedAt: new Date(now).toISOString(),
          expiresAt: new Date(now + input.config.durationMinutes * 60_000).toISOString(),
          status: "IN_PROGRESS",
          answers: {},
          flagged: [],
        };
        set((state) => ({ attempts: [attempt, ...state.attempts] }));
        return attempt;
      },

      saveAnswer: (attemptId, questionId, optionId) =>
        set((state) => ({
          attempts: state.attempts.map((attempt) =>
            attempt.id === attemptId
              ? { ...attempt, answers: { ...attempt.answers, [questionId]: optionId } }
              : attempt,
          ),
        })),

      toggleFlag: (attemptId, questionId) =>
        set((state) => ({
          attempts: state.attempts.map((attempt) =>
            attempt.id === attemptId
              ? {
                  ...attempt,
                  flagged: attempt.flagged.includes(questionId)
                    ? attempt.flagged.filter((id) => id !== questionId)
                    : [...attempt.flagged, questionId],
                }
              : attempt,
          ),
        })),

      submit: (attemptId, status = "SUBMITTED") =>
        set((state) => ({
          attempts: state.attempts.map((attempt) =>
            attempt.id === attemptId && attempt.status === "IN_PROGRESS"
              ? { ...attempt, status, submittedAt: new Date().toISOString() }
              : attempt,
          ),
        })),

      remove: (attemptId) =>
        set((state) => ({ attempts: state.attempts.filter((attempt) => attempt.id !== attemptId) })),
    }),
    {
      name: "devassess-exams",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/* ------------------------------------------------------------------ helpers */

/**
 * True once the persisted store has rehydrated from localStorage.
 *
 * Redirect logic must wait for this: the first render happens before the
 * persisted attempts are available, so redirecting early would kick the user
 * out of a perfectly valid attempt.
 *
 * Starts as `false` on both the server and the first client render so the
 * markup matches during hydration, then flips in an effect.
 */
export function useExamsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // `persist` only attaches this API when storage is available — on the
    // server (or with storage blocked) it is undefined, so treat the in-memory
    // store as ready rather than hanging on a spinner.
    const persistApi = useExamsStore.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    setHydrated(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

export function attemptById(attempts: ExamAttempt[], id: string | undefined): ExamAttempt | undefined {
  if (!id) return undefined;
  return attempts.find((attempt) => attempt.id === id);
}

export function attemptsFor(attempts: ExamAttempt[], technology: string): ExamAttempt[] {
  return attempts.filter((attempt) => attempt.technology === technology);
}

/** Idempotent grade for an attempt, resolved against its bank. */
export function gradeAttemptById(attempt: ExamAttempt, bank: QuestionBank): GradeResult | null {
  if (attempt.status === "IN_PROGRESS") return null;
  return gradeAttempt(attempt, bank, PASS_PERCENT);
}

/** Remaining seconds (never negative) for an in-progress attempt. */
export function secondsLeft(attempt: ExamAttempt, now: number = Date.now()): number {
  return Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - now) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
