/**
 * Types for the built-in video-interview question bank.
 *
 * The bank is plain data so new technologies can be added without touching the
 * service layer: create `./<technology>.ts` exporting an `InterviewTopic` and
 * register it in `./index.ts`.
 */

export type InterviewDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface BankQuestion {
  /** Stable identifier — stored as `InterviewQuestion.bankKey`. */
  key: string;
  topic: string;
  difficulty: InterviewDifficulty;
  /** The question spoken/read to the candidate. */
  prompt: string;
  /** Progressive hints revealed by the candidate (requirement 11). */
  hints: string[];
  /** Keywords a strong spoken answer should contain (used by the AI rubric). */
  keywords: string[];
  /** Reference answer shown to the interviewer only. */
  model: string;
}

export interface InterviewTopic {
  /** Stable id used in the API (`Interview.technology`). */
  id: string;
  label: string;
  description: string;
  questions: BankQuestion[];
}

/** Uniform Fisher–Yates shuffle. */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}
