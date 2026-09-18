import type { Difficulty } from "@/lib/types";

/** A single worked example shown in the problem description. */
export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

/** How the runner compares the actual return value against the expected one. */
export type CompareMode = "exact" | "unordered";

export interface PracticeTestCase {
  /** Positional arguments passed to the solution function. */
  args: unknown[];
  /** The expected return value (deep-compared). */
  expected: unknown;
  /** Hidden test cases only run on Submit, not on Run. */
  isHidden?: boolean;
  /** `"unordered"` sorts array results before comparing (Two Sum, 3Sum, …). */
  compareMode?: CompareMode;
}

export interface PracticeProblem {
  /** URL slug, e.g. `"two-sum"`. */
  id: string;
  /** Display order in the problem list. */
  number: number;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  /** Markdown-ish description (inline `code`, paragraphs separated by \n\n). */
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  /** Name of the function the user must implement. */
  functionName: string;
  starterCode: {
    javascript: string;
    typescript: string;
  };
  testCases: PracticeTestCase[];
  hints: string[];
}

/** Lightweight row for the problem-list table (no description or test cases). */
export interface ProblemIndexEntry {
  id: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  topics: string[];
}

export type { Difficulty };
