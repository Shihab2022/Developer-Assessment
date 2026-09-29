import type { Difficulty, PracticeProblem, ProblemIndexEntry } from "@/lib/practice/types";
import { PRACTICE_PROBLEMS } from "@/data/practice-problems/problems";
import { GENERATED_PROBLEMS } from "@/data/practice-problems/generated-problems";

/**
 * Server-side problem registry.
 *
 * The full problem bank (descriptions + test cases) stays on the server: the
 * index page passes only `ProblemIndexEntry` rows to the client, and the solver
 * page passes a single problem. `problemById` is used by both.
 *
 * The bank is the 110 hand-curated problems plus the generated sets produced by
 * `scripts/generate-practice-bank.mjs` (`generated-problems.ts`).
 */

/** Hand-curated problems — small enough to pre-render at build time. */
export const CURATED_PROBLEMS: PracticeProblem[] = [...PRACTICE_PROBLEMS];

/** Number of hand-curated problems; generated problems continue after this. */
export const CURATED_PROBLEM_COUNT = CURATED_PROBLEMS.length;

/**
 * The whole bank, ordered by problem number.
 *
 * The generated bank is imported **here and nowhere else**: client components
 * must reach for `CURATED_PROBLEMS` or an `ProblemIndexEntry` row instead, so
 * the multi-megabyte generated file never lands in a browser bundle.
 */
export const ALL_PROBLEMS: PracticeProblem[] = [...PRACTICE_PROBLEMS, ...GENERATED_PROBLEMS].sort(
  (a, b) => a.number - b.number,
);

export const PROBLEM_COUNT = ALL_PROBLEMS.length;

/**
 * Problems rendered to static HTML at build time.
 *
 * The curated bank is small and stable, so it is worth pre-rendering for
 * instant first paint and crawlability; the 900+ generated problems render on
 * demand instead of adding minutes to every `next build`.
 */
export const PRE_RENDERED_PROBLEMS: PracticeProblem[] = ALL_PROBLEMS.filter(
  (problem) => problem.number <= CURATED_PROBLEM_COUNT,
);

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
