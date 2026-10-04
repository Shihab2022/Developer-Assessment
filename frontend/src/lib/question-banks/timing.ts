import type { BankQuestion, QuestionBank } from "./types";

/**
 * Per-question time budget.
 *
 * Exams are not a fixed number of minutes — each question carries its own
 * allowance based on how hard it is, so a 20-question mixed paper and a
 * 20-question hard paper legitimately get different clocks. The total exam
 * duration is the sum of the per-question allowances for the questions that
 * were actually drawn (see `totalSecondsForQuestions`).
 *
 *   EASY   → 40 seconds
 *   MEDIUM → 50 seconds
 *   HARD   → 60 seconds
 */
export const PER_QUESTION_SECONDS: Record<string, number> = {
  EASY: 40,
  MEDIUM: 50,
  HARD: 60,
};

/** Fallback for a question whose difficulty is unknown/missing. */
export const DEFAULT_QUESTION_SECONDS = 50;

/** Allowance (seconds) for a single question, by difficulty. */
export function secondsForDifficulty(difficulty: string | undefined): number {
  if (!difficulty) return DEFAULT_QUESTION_SECONDS;
  return PER_QUESTION_SECONDS[difficulty] ?? DEFAULT_QUESTION_SECONDS;
}

/** Allowance (seconds) for a bank question. */
export function secondsForQuestion(question: Pick<BankQuestion, "difficulty">): number {
  return secondsForDifficulty(question.difficulty);
}

/** Sum of the per-question allowances for the supplied questions. */
export function totalSecondsForQuestions(
  questions: Array<Pick<BankQuestion, "difficulty">>,
): number {
  return questions.reduce((sum, question) => sum + secondsForQuestion(question), 0);
}

/**
 * Pre-start estimate: what the clock will be for `count` questions drawn from
 * the filtered pool. Uses the pool average so a mixed-difficulty paper gets a
 * sensible preview before the real questions are drawn.
 */
export function estimatedSecondsForPaper(
  bank: QuestionBank,
  options: { count: number; difficulty?: string; topics?: string[] },
): number {
  const { count, difficulty, topics } = options;
  const pool = bank.questions.filter((question) => {
    if (difficulty && difficulty !== "ALL" && question.difficulty !== difficulty) return false;
    if (topics && topics.length > 0 && !topics.includes(question.topic)) return false;
    return true;
  });

  const drawCount = Math.max(1, Math.min(count, pool.length || count));
  const averageSeconds = pool.length
    ? totalSecondsForQuestions(pool) / pool.length
    : DEFAULT_QUESTION_SECONDS;

  // Always leave at least a minute even for a single easy question.
  return Math.max(60, Math.round(drawCount * averageSeconds));
}

/** Exact clock (seconds) for the paper that was actually drawn. */
export function exactSecondsForQuestions(questions: QuestionBank["questions"]): number {
  return Math.max(60, totalSecondsForQuestions(questions));
}

/** `m:ss` for either a countdown or a duration. */
export function formatClockFromSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Human summary like `12 min (~50s / question)`. */
export function describeDuration(seconds: number, questionCount: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const perQuestion = questionCount > 0 ? Math.round(seconds / questionCount) : 0;
  return `${minutes} min (~${perQuestion}s / question)`;
}

/** Suggested per-question allowance for a bank (average, rough preview). */
export function averageQuestionSeconds(bank: QuestionBank): number {
  if (!bank.questions.length) return DEFAULT_QUESTION_SECONDS;
  return Math.round(totalSecondsForQuestions(bank.questions) / bank.questions.length);
}
