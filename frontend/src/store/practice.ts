import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";

/**
 * Practice progress.
 *
 * Stores what the user has solved, how many attempts each problem took, and the
 * in-editor draft for each language. Drafts are keyed by problem so switching
 * problems never loses work.
 */

export type PracticeLanguage = "javascript" | "typescript";

export interface SolvedRecord {
  problemId: string;
  language: PracticeLanguage;
  solvedAt: string;
  /** Attempts recorded for this problem (incremented on every submit). */
  attempts: number;
  /** Best pass ratio achieved, e.g. 1 for "all tests passed". */
  bestRatio: number;
}

interface PracticeState {
  solved: Record<string, SolvedRecord>;
  /** problemId -> language -> draft source. */
  drafts: Record<string, Partial<Record<PracticeLanguage, string>>>;
  /** problemId -> last language used. */
  language: Record<string, PracticeLanguage>;

  /** Records a submission outcome; marks the problem solved on a full pass. */
  recordAttempt: (input: {
    problemId: string;
    language: PracticeLanguage;
    passed: number;
    total: number;
  }) => void;
  setDraft: (problemId: string, language: PracticeLanguage, code: string) => void;
  clearDraft: (problemId: string, language: PracticeLanguage) => void;
  setLanguage: (problemId: string, language: PracticeLanguage) => void;
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      solved: {},
      drafts: {},
      language: {},

      recordAttempt: ({ problemId, language, passed, total }) =>
        set((state) => {
          const ratio = total === 0 ? 0 : passed / total;
          const previous = state.solved[problemId];
          const attempts = (previous?.attempts ?? 0) + 1;

          // Only a complete pass marks a problem as solved, but the attempt
          // counter keeps incrementing so a user can see how many tries it took.
          if (ratio < 1) {
            return {
              solved: {
                ...state.solved,
                [problemId]: {
                  problemId,
                  language,
                  solvedAt: previous?.solvedAt ?? "",
                  attempts,
                  bestRatio: Math.max(previous?.bestRatio ?? 0, ratio),
                },
              },
            };
          }

          return {
            solved: {
              ...state.solved,
              [problemId]: {
                problemId,
                language,
                solvedAt: new Date().toISOString(),
                attempts,
                bestRatio: 1,
              },
            },
          };
        }),

      setDraft: (problemId, language, code) =>
        set((state) => ({
          drafts: {
            ...state.drafts,
            [problemId]: { ...state.drafts[problemId], [language]: code },
          },
        })),

      clearDraft: (problemId, language) =>
        set((state) => {
          const existing = state.drafts[problemId];
          if (!existing) return state;
          const next = { ...existing };
          delete next[language];
          return { drafts: { ...state.drafts, [problemId]: next } };
        }),

      setLanguage: (problemId, language) =>
        set((state) => ({ language: { ...state.language, [problemId]: language } })),

      reset: () => set({ solved: {}, drafts: {}, language: {} }),
    }),
    {
      name: "devassess-practice",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/* ------------------------------------------------------------------ helpers */

/**
 * True once the persisted store has rehydrated.
 *
 * Starts `false` on the server and the first client render so the markup
 * matches, then flips in an effect. Mirrors `useExamsHydrated`.
 */
export function usePracticeHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = usePracticeStore.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    setHydrated(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

export function isSolved(solved: Record<string, SolvedRecord>, problemId: string): boolean {
  return Boolean(solved[problemId]?.solvedAt);
}

export function solvedCount(solved: Record<string, SolvedRecord>): number {
  return Object.values(solved).filter((record) => Boolean(record.solvedAt)).length;
}

/** Difficulty buckets that have at least one solved problem. */
export function solvedByDifficulty(
  solved: Record<string, SolvedRecord>,
  problems: { id: string; difficulty: string }[],
): Record<string, { solved: number; total: number }> {
  const result: Record<string, { solved: number; total: number }> = {};

  for (const problem of problems) {
    const bucket = result[problem.difficulty] ?? { solved: 0, total: 0 };
    bucket.total += 1;
    if (isSolved(solved, problem.id)) bucket.solved += 1;
    result[problem.difficulty] = bucket;
  }
  return result;
}