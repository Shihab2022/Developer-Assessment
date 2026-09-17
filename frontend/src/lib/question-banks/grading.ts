import type { BankQuestion, QuestionBank } from "./types";
import type { ExamAttempt } from "@/store/exams";

export interface GradedQuestion {
  questionId: string;
  chosenOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  answered: boolean;
}

export interface GradeResult {
  total: number;
  answered: number;
  correct: number;
  wrong: number;
  skipped: number;
  percent: number;
  passed: boolean;
  passPercent: number;
  perQuestion: GradedQuestion[];
}

/** Grades a stored attempt against the bank it was drawn from. */
export function gradeAttempt(attempt: ExamAttempt, bank: QuestionBank, passPercent = 60): GradeResult {
  const byId = new Map<string, BankQuestion>(bank.questions.map((question) => [question.id, question]));

  const perQuestion: GradedQuestion[] = attempt.questionIds.map((questionId) => {
    const question = byId.get(questionId);
    const chosenOptionId = attempt.answers[questionId] ?? null;
    const correctOptionId = question?.correctOptionId ?? "";
    return {
      questionId,
      chosenOptionId,
      correctOptionId,
      isCorrect: Boolean(chosenOptionId) && chosenOptionId === correctOptionId,
      answered: Boolean(chosenOptionId),
    };
  });

  const total = perQuestion.length;
  const answered = perQuestion.filter((item) => item.answered).length;
  const correct = perQuestion.filter((item) => item.isCorrect).length;
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);

  return {
    total,
    answered,
    correct,
    wrong: answered - correct,
    skipped: total - answered,
    percent,
    passed: percent >= passPercent,
    passPercent,
    perQuestion,
  };
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}
