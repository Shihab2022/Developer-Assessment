import type { BankQuestion, QuestionBank, TechnologyId } from "./types";

/**
 * Client-side loader. Each bank is a separate dynamic chunk, so a visitor only
 * downloads the technology they actually start — and never on the landing page.
 */

const LOADERS: Record<string, () => Promise<{ default: QuestionBank }>> = {
  javascript: () => import("@/data/question-banks/javascript.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
  typescript: () => import("@/data/question-banks/typescript.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
  python: () => import("@/data/question-banks/python.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
  css: () => import("@/data/question-banks/css.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
  html: () => import("@/data/question-banks/html.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
  react: () => import("@/data/question-banks/react.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
  nextjs: () => import("@/data/question-banks/nextjs.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
  sql: () => import("@/data/question-banks/sql.json").then((m) => ({ default: m.default as unknown as QuestionBank })),
};

export async function loadBank(technology: TechnologyId | string): Promise<QuestionBank> {
  const loader = LOADERS[technology];
  if (!loader) throw new Error(`Unknown question bank: ${technology}`);
  const module = await loader();
  return module.default as QuestionBank;
}

/** Bank question keyed by id, for O(1) lookups while grading. */
export function indexBank(bank: QuestionBank): Map<string, BankQuestion> {
  return new Map(bank.questions.map((question) => [question.id, question]));
}
