import { createExamPlan, createSeed, mulberry32 } from "@/lib/question-banks/sample";
import type { QuestionBlock, QuestionBank } from "@/lib/question-banks/types";
import type { PracticeProblem } from "@/lib/practice/types";
import type { Difficulty } from "@/lib/types";
import { libraryProblem } from "./library";
import type {
  Competition,
  CompetitionRules,
  OwnCodingTestCase,
  OwnQuestion,
  PaperItem,
} from "./types";

/**
 * Paper assembly (requirements 4 & 5).
 *
 * A paper is a list of `PaperItem` rows that may come from any mix of sources —
 * our MCQ banks, our coding bank, or the host's own questions. Rows are
 * resolved against the loaded banks at render time, and every participant gets
 * the *same* rows in a *seeded* order, so the leaderboard compares like-for-like
 * answers while cutting answer copying.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Short, unambiguous invite code, e.g. `DK-7F2QA9`. */
export function createInviteCode(): string {
  const cryptoRef = globalThis.crypto;
  const bytes = new Uint8Array(6);
  if (cryptoRef?.getRandomValues) cryptoRef.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);

  const chars = Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]);
  return `${chars.slice(0, 2).join("")}-${chars.slice(2).join("")}`;
}

/** Fresh per-participant seed. */
export function createEntrySeed(): number {
  return createSeed();
}

/** Fisher–Yates driven by a seeded PRNG so the order is reproducible. */
export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
}

/** Picks MCQ question ids from a loaded bank honouring the builder's filters. */
export function pickLibraryQuestions(
  bank: QuestionBank,
  options: { count: number; difficulty?: string; topics?: string[]; seed: number },
): string[] {
  const plan = createExamPlan(bank, {
    count: options.count,
    difficulty: options.difficulty,
    topics: options.topics,
    shuffleOptions: true,
    seed: options.seed,
  });
  return plan.questionIds;
}

/* ------------------------------------------------------------- resolution */

export interface ResolvedMcqRow {
  kind: "mcq";
  itemId: string;
  points: number;
  sourceLabel: string;
  title: string;
  blocks: QuestionBlock[];
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
  topic: string;
  difficulty: Difficulty;
}

export interface ResolvedCodingRow {
  kind: "coding";
  itemId: string;
  points: number;
  sourceLabel: string;
  problem: PracticeProblem;
  language: "javascript" | "typescript";
  functionName: string;
  starterCode: { javascript: string; typescript: string };
  testCases: OwnCodingTestCase[];
}

export interface ResolvedWrittenRow {
  kind: "written";
  itemId: string;
  points: number;
  sourceLabel: string;
  title: string;
  prompt: string;
  maxWords?: number;
}

export type ResolvedRow = ResolvedMcqRow | ResolvedCodingRow | ResolvedWrittenRow;

export interface ResolveInput {
  items: PaperItem[];
  ownQuestions: OwnQuestion[];
  /** MCQ banks loaded for the technologies the paper references. */
  banks: Record<string, QuestionBank>;
}

/** Resolves paper rows against the loaded banks; unresolvable rows are reported. */
export function resolvePaperRows(input: ResolveInput): { rows: ResolvedRow[]; missing: string[] } {
  const ownById = new Map(input.ownQuestions.map((question) => [question.id, question]));
  const rows: ResolvedRow[] = [];
  const missing: string[] = [];

  for (const item of input.items) {
    const base = { itemId: item.id, points: item.points };

    if (item.source === "own") {
      const question = item.ownId ? ownById.get(item.ownId) : undefined;
      if (!question) {
        missing.push(item.id);
        continue;
      }

      if (question.type === "MCQ") {
        rows.push({
          ...base,
          kind: "mcq",
          sourceLabel: "Your question",
          title: question.title,
          blocks: [{ type: "text", value: question.prompt }],
          options: question.options ?? [],
          correctOptionId: question.correctOptionId ?? "",
          explanation: question.explanation,
          topic: question.topic,
          difficulty: question.difficulty,
        });
      } else if (question.type === "CODING" && question.coding) {
        const coding = question.coding;
        rows.push({
          ...base,
          kind: "coding",
          sourceLabel: "Your question",
          problem: {
            id: item.id,
            number: 0,
            title: question.title,
            difficulty: question.difficulty,
            topics: [question.topic],
            description: question.prompt,
            examples: [],
            constraints: [],
            functionName: coding.functionName,
            starterCode: coding.starterCode,
            testCases: coding.testCases.map((testCase) => ({
              args: testCase.args,
              expected: testCase.expected,
              isHidden: testCase.isHidden,
            })),
            hints: [],
          },
          language: coding.language,
          functionName: coding.functionName,
          starterCode: coding.starterCode,
          testCases: coding.testCases,
        });
      } else {
        rows.push({
          ...base,
          kind: "written",
          sourceLabel: "Your question",
          title: question.title,
          prompt: question.prompt,
          maxWords: question.written?.maxWords,
        });
      }
      continue;
    }

    if (item.source === "library-coding") {
      const problem = item.problemId ? libraryProblem(item.problemId) : undefined;
      if (!problem) {
        missing.push(item.id);
        continue;
      }
      rows.push({
        ...base,
        kind: "coding",
        sourceLabel: "Practice bank",
        problem,
        language: "javascript",
        functionName: problem.functionName,
        starterCode: problem.starterCode,
        testCases: problem.testCases.map((testCase) => ({
          args: testCase.args,
          expected: testCase.expected,
          isHidden: testCase.isHidden,
        })),
      });
      continue;
    }

    const bank = item.technology ? input.banks[item.technology] : undefined;
    const question = bank?.questions.find((entry) => entry.id === item.questionId);
    if (!bank || !question) {
      missing.push(item.id);
      continue;
    }
    rows.push({
      ...base,
      kind: "mcq",
      sourceLabel: `${bank.label} bank`,
      title: question.title,
      blocks: question.content,
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
    });
  }

  return { rows, missing };
}

/* -------------------------------------------------------------- run plan */

export interface RunPlan {
  /** Paper row ids in this participant's presentation order. */
  questionOrder: string[];
  /** Paper row id -> option ids in presentation order (MCQ rows only). */
  optionOrders: Record<string, string[]>;
}

/** Builds the per-participant plan: same rows, seeded order. */
export function buildRunPlan(rows: ResolvedRow[], rules: CompetitionRules, seed: number): RunPlan {
  const ids = rows.map((row) => row.itemId);
  const questionOrder = rules.shuffleQuestions ? shuffleWithSeed(ids, seed) : ids;

  const optionOrders: Record<string, string[]> = {};
  if (rules.shuffleOptions) {
    const random = mulberry32(seed ^ 0x9e3779b9);
    for (const row of rows) {
      if (row.kind !== "mcq") continue;
      optionOrders[row.itemId] = shuffleWithSeed(
        row.options.map((option) => option.id),
        (random() * 0xffffffff) >>> 0,
      );
    }
  }

  return { questionOrder, optionOrders };
}

/** Options for a row in the participant's stored order. */
export function orderedOptions(
  row: ResolvedMcqRow,
  optionOrders: Record<string, string[]> | undefined,
): { id: string; text: string }[] {
  const order = optionOrders?.[row.itemId];
  if (!order || order.length !== row.options.length) return row.options;
  const byId = new Map(row.options.map((option) => [option.id, option]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((option): option is { id: string; text: string } => Boolean(option));
  return ordered.length === row.options.length ? ordered : row.options;
}

/** Rows in the order stored for a participant (falls back to paper order). */
export function rowsInOrder(rows: ResolvedRow[], order: string[] | undefined): ResolvedRow[] {
  if (!order?.length) return rows;
  const byItemId = new Map(rows.map((row) => [row.itemId, row]));
  const ordered: ResolvedRow[] = [];
  for (const itemId of order) {
    const row = byItemId.get(itemId);
    if (row) ordered.push(row);
  }
  // Rows added after the participant started are appended so nothing is lost.
  for (const row of rows) if (!order.includes(row.itemId)) ordered.push(row);
  return ordered;
}

/** Is the competition currently joinable given its rules and status? */
export function isJoinable(competition: Competition, now: number = Date.now()): boolean {
  if (competition.status !== "OPEN") return false;
  const { opensAt, closesAt } = competition.rules;
  if (opensAt && new Date(opensAt).getTime() > now) return false;
  if (closesAt && new Date(closesAt).getTime() < now) return false;
  return true;
}