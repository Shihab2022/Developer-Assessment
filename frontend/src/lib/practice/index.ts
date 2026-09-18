import { PRACTICE_PROBLEMS } from "@/data/practice-problems/problems";
import type { Difficulty, PracticeProblem, ProblemIndexEntry } from "./types";

/**
 * Server-side problem registry.
 *
 * The full problem bank (descriptions + test cases) stays on the server: the
 * index page passes only `ProblemIndexEntry` rows to the client, and the solver
 * page passes a single problem. `problemById` is used by both.
 */

export const ALL_PROBLEMS: PracticeProblem[] = [...PRACTICE_PROBLEMS].sort(
  (a, b) => a.number - b.number,
);

export const PROBLEM_COUNT = ALL_PROBLEMS.length;

export function problemById(id: string): PracticeProblem | undefined {
  return ALL_PROBLEMS.find((problem) => problem.id === id);
}

/** Lightweight rows for the list view (no description/test cases). */
export const PROBLEM_INDEX: ProblemIndexEntry[] = ALL_PROBLEMS.map((problem) => ({
  id: problem.id,
  number: problem.number,
  title: problem.title,
  difficulty: problem.difficulty,
  topics: problem.topics,
}));

const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export const DIFFICULTY_COUNTS: Record<Difficulty, number> = DIFFICULTY_ORDER.reduce(
  (acc, difficulty) => {
    acc[difficulty] = ALL_PROBLEMS.filter((problem) => problem.difficulty === difficulty).length;
    return acc;
  },
  { EASY: 0, MEDIUM: 0, HARD: 0 },
);

/** Every distinct topic across the bank, alphabetically. */
export const ALL_TOPICS: string[] = Array.from(
  new Set(ALL_PROBLEMS.flatMap((problem) => problem.topics)),
).sort((a, b) => a.localeCompare(b));

/** Total visible + hidden test cases in the bank (used for the header copy). */
export const TOTAL_TEST_CASES = ALL_PROBLEMS.reduce(
  (sum, problem) => sum + problem.testCases.length,
  0,
);
