import type { BankQuestion, QuestionBank } from "./types";

/**
 * Random selection. A numeric seed drives a small deterministic PRNG so the
 * same attempt always rebuilds the same paper — reload-safe without a server.
 */

/** Fast, well-distributed 32-bit PRNG (Mulberry32). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash (FNV-1a) so a string seed becomes a number. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createSeed(): number {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.getRandomValues) {
    const buffer = new Uint32Array(1);
    cryptoRef.getRandomValues(buffer);
    return buffer[0] ?? Date.now();
  }
  return Date.now() & 0xffffffff;
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
        const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
}

export interface ExamPlan {
  /** Question ids in exam order. */
  questionIds: string[];
  /** Per-question permutation of option ids (empty when options are not shuffled). */
  optionOrders: Record<string, string[]>;
}

/**
 * Picks `count` random questions (optionally filtered) and, when requested,
 * permutes their options. Filters that leave fewer questions than requested
 * simply produce a shorter paper.
 */
export function createExamPlan(
  bank: QuestionBank,
  options: {
    count: number;
    difficulty?: string;
    topics?: string[];
    shuffleOptions?: boolean;
    seed: number;
  },
): ExamPlan {
  const { count, difficulty, topics, shuffleOptions = true, seed } = options;
  const random = mulberry32(seed);

  const pool = bank.questions.filter((question) => {
    if (difficulty && difficulty !== "ALL" && question.difficulty !== difficulty) return false;
    if (topics && topics.length > 0 && !topics.includes(question.topic)) return false;
    return true;
  });

  const picked = shuffled(pool, random).slice(0, Math.max(1, count));

  const optionOrders: Record<string, string[]> = {};
  if (shuffleOptions) {
    for (const question of picked) {
      optionOrders[question.id] = shuffled(
        question.options.map((option) => option.id),
        random,
      );
    }
  }

  return { questionIds: picked.map((question) => question.id), optionOrders };
}

/** A paper is the plan resolved against the bank, ready to render. */
export interface PaperQuestion {
  question: BankQuestion;
  /** Option ids in presentation order (bank order when not shuffled). */
  optionOrder: string[];
}

export function buildPaper(bank: QuestionBank, plan: ExamPlan): PaperQuestion[] {
  const byId = new Map(bank.questions.map((question) => [question.id, question]));
  const paper: PaperQuestion[] = [];

  for (const id of plan.questionIds) {
    const question = byId.get(id);
    if (!question) continue;
    const order = plan.optionOrders[id];
    paper.push({
      question,
      optionOrder:
        order && order.length === question.options.length
          ? order
          : question.options.map((option) => option.id),
    });
  }
  return paper;
}
