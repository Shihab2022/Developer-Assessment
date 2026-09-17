import type { Difficulty } from "@/lib/types";

/** A question body is an ordered list of prose and code blocks. */
export type QuestionBlock =
  | { type: "text"; value: string }
  | { type: "code"; value: string; language?: string };

export interface QuestionOption {
  /** Stable option id ("A"-"D"). */
  id: string;
  text: string;
  /** Optional code snippet rendered instead of inline text. */
  code?: string;
}

export interface BankLevel {
  id: string;
  label: string;
}

/** One multiple-choice question as stored in `src/data/question-banks/*.json`. */
export interface BankQuestion {
  id: string;
  level: string;
  levelLabel: string;
  topic: string;
  difficulty: Difficulty;
  title: string;
  /** The question line itself (equals `title`). */
  prompt: string;
  /** Prose and code shown underneath the prompt, in source order. */
  content: QuestionBlock[];
  options: QuestionOption[];
  correctOptionId: string;
  explanation: string;
}

/** The JSON document produced by `scripts/build-question-banks.mjs`. */
export interface QuestionBank {
  technology: string;
  label: string;
  description: string;
  source: string;
  generatedAt?: string;
  questionCount: number;
  levels: BankLevel[];
  topics: string[];
  difficultyCounts: Record<string, number>;
  levelCounts: Record<string, number>;
  questions: BankQuestion[];
}

/** Presentation metadata computed on the server from a bank file. */
export interface TechnologyMeta {
  id: string;
  label: string;
  description: string;
  /** lucide-react icon name, resolved by the rendering component. */
  icon: string;
  /** Tailwind gradient classes for the card accent. */
  accent: string;
  questionCount: number;
  difficultyCounts: Record<string, number>;
  topics: string[];
  levels: BankLevel[];
  source: string;
  sourceKind: "curated-repo" | "authored";
}

export type { Difficulty };

/** Identifier for a question-bank technology (the bank file key). */
export type TechnologyId = "javascript" | "typescript" | "python" | "css" | "html" | "sql" | "react" | "nextjs";
