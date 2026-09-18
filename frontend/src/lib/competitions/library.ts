import { PROBLEM_INDEX, problemById } from "@/lib/practice/index";
import type { PracticeProblem } from "@/lib/practice/types";
import { TECHNOLOGY_CATALOG } from "@/lib/question-banks/catalog";
import type { BankQuestion, QuestionBank } from "@/lib/question-banks/types";
import type { Difficulty } from "@/lib/types";
import type { OwnQuestion } from "./types";

/**
 * The built-in question library a host can draw on (requirement 5).
 *
 * Two sources live here:
 *
 * - **MCQ banks** — the eight technology question banks. Only metadata is
 *   imported eagerly (`catalog.ts`); the questions themselves are loaded with
 *   `loadBank()` one technology at a time so nothing heavy ships up front.
 * - **Coding problems** — the practice-arena bank, exposed as lightweight rows.
 *
 * "Import into my bank" forks a library item into a company-owned copy that the
 * host can then edit freely; the fork is what makes mixing our questions with
 * their own possible in a single paper.
 */

export interface LibraryTechnologyRow {
  id: string;
  label: string;
  description: string;
  icon: string;
  accent: string;
  highlights: string[];
}

/** Technologies whose MCQ banks can be used in a paper. */
export const LIBRARY_TECHNOLOGIES: LibraryTechnologyRow[] = TECHNOLOGY_CATALOG.map((entry) => ({
  id: entry.id,
  label: entry.label,
  description: entry.description,
  icon: entry.icon,
  accent: entry.accent,
  highlights: entry.highlights,
}));

export interface LibraryProblemRow {
  id: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  topics: string[];
}

/** Coding problems from the practice arena (no test cases — those stay server-side in the page). */
export const LIBRARY_PROBLEMS: LibraryProblemRow[] = PROBLEM_INDEX.map((problem) => ({
  id: problem.id,
  number: problem.number,
  title: problem.title,
  difficulty: problem.difficulty,
  topics: problem.topics,
}));

export function libraryProblemRow(problemId: string): LibraryProblemRow | undefined {
  return PROBLEM_INDEX.find((problem) => problem.id === problemId);
}

export function libraryTechnologyRow(technology: string): LibraryTechnologyRow | undefined {
  return LIBRARY_TECHNOLOGIES.find((entry) => entry.id === technology);
}

/** Renders a bank question's code blocks into a single prompt string. */
function promptWithCode(question: BankQuestion): string {
  const parts = [question.prompt];
  for (const block of question.content ?? []) {
    if (block.type === "code") parts.push(`\`\`\`${block.language ?? ""}\n${block.value}\n\`\`\``);
    else if (block.value && block.value !== question.prompt) parts.push(block.value);
  }
  return parts.join("\n\n");
}

/**
 * Forks one of our MCQ questions into a company-owned copy.
 *
 * The id is derived from the source question, so importing the same question
 * twice updates the existing copy instead of creating duplicates.
 */
export function ownQuestionFromBankQuestion(
  bank: QuestionBank,
  question: BankQuestion,
  now: string = new Date().toISOString(),
): OwnQuestion {
  return {
    id: `own-lib-${question.id}`,
    type: "MCQ",
    title: question.title,
    prompt: promptWithCode(question),
    difficulty: question.difficulty,
    topic: question.topic,
    importedFrom: `${bank.label} bank · ${question.id}`,
    explanation: question.explanation,
    options: question.options.map((option) => ({ id: option.id, text: option.text })),
    correctOptionId: question.correctOptionId,
    createdAt: now,
    updatedAt: now,
  };
}

/** Forks a coding problem into a company-owned copy (starter code + tests). */
export function ownQuestionFromProblem(
  problem: PracticeProblem,
  now: string = new Date().toISOString(),
): OwnQuestion {
  return {
    id: `own-lib-${problem.id}`,
    type: "CODING",
    title: `${problem.number}. ${problem.title}`,
    prompt: problem.description,
    difficulty: problem.difficulty,
    topic: problem.topics[0] ?? "Algorithms",
    importedFrom: `Practice arena · ${problem.id}`,
    explanation: problem.hints[0],
    coding: {
      language: "javascript",
      functionName: problem.functionName,
      starterCode: problem.starterCode,
      testCases: problem.testCases.map((testCase) => ({
        args: testCase.args,
        expected: testCase.expected,
        isHidden: testCase.isHidden,
      })),
    },
    createdAt: now,
    updatedAt: now,
  };
}

/** Loads the full practice problem (starter code + test cases) for a paper row. */
export function libraryProblem(problemId: string): PracticeProblem | undefined {
  return problemById(problemId);
}