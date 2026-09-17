import javascriptBank from "@/data/question-banks/javascript.json";
import typescriptBank from "@/data/question-banks/typescript.json";
import pythonBank from "@/data/question-banks/python.json";
import cssBank from "@/data/question-banks/css.json";
import htmlBank from "@/data/question-banks/html.json";
import sqlBank from "@/data/question-banks/sql.json";
import { catalogById } from "./catalog";
import type { QuestionBank, TechnologyMeta } from "./types";

/**
 * Server-side registry.
 *
 * Imports every bank so the `/exams` index can render live counts at build
 * time. Never import this from a client component — use `catalog.ts` for
 * presentation metadata and `loadBank()` for the questions themselves.
 */

const BANKS: QuestionBank[] = [
  javascriptBank as unknown as QuestionBank,
  typescriptBank as unknown as QuestionBank,
  pythonBank as unknown as QuestionBank,
  cssBank as unknown as QuestionBank,
  htmlBank as unknown as QuestionBank,
  sqlBank as unknown as QuestionBank,
];

function toMeta(bank: QuestionBank): TechnologyMeta {
  const entry = catalogById(bank.technology);
  return {
    id: bank.technology,
    label: bank.label,
    description: bank.description,
    icon: entry?.icon ?? "Library",
    accent: entry?.accent ?? "from-primary-500 to-sky-500",
    questionCount: bank.questionCount,
    difficultyCounts: bank.difficultyCounts,
    topics: bank.topics,
    levels: bank.levels,
    source: bank.source,
    sourceKind: bank.source.includes("github.com") ? "curated-repo" : "authored",
  };
}

export const TECHNOLOGIES: TechnologyMeta[] = BANKS.map(toMeta).sort(
  (a, b) => b.questionCount - a.questionCount,
);

export function technologyById(id: string): TechnologyMeta | undefined {
  return TECHNOLOGIES.find((tech) => tech.id === id);
}

export const TOTAL_QUESTIONS = TECHNOLOGIES.reduce((sum, tech) => sum + tech.questionCount, 0);
