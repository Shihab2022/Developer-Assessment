/**
 * Types for the built-in video-interview question bank.
 *
 * The bank is plain data so new technologies can be added without touching the
 * service layer: create `./<technology>.ts` exporting an `InterviewTopic` and
 * register it in `./index.ts`.
 */

export type InterviewDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface BankQuestion {
  /** Stable identifier — stored as `InterviewQuestion.bankKey`. */
  key: string;
  topic: string;
  difficulty: InterviewDifficulty;
  /** The question spoken/read to the candidate. */
  prompt: string;
  /** Progressive hints revealed by the candidate (requirement 11). */
  hints: string[];
  /** Keywords a strong spoken answer should contain (used by the AI rubric). */
  keywords: string[];
  /** Reference answer shown to the interviewer only. */
  model: string;
}

export interface InterviewTopic {
  /** Stable id used in the API (`Interview.technology`). */
  id: string;
  label: string;
  description: string;
  questions: BankQuestion[];
}

/**
 * Compact tuple form used to author bank questions without the object boilerplate:
 * `[key, topic, difficulty, prompt, hints, keywords, model]`.
 * `defineTopic()` expands the tuples into `BankQuestion` objects.
 */
export type BankQuestionTuple = readonly [
  key: string,
  topic: string,
  difficulty: InterviewDifficulty,
  prompt: string,
  hints: readonly string[],
  keywords: readonly string[],
  model: string,
];

/** A bank question as either a full object or a compact tuple. */
export type BankQuestionInput = BankQuestion | BankQuestionTuple;

/** Expands a mix of `BankQuestion` objects and tuples into full objects. */
export function defineQuestions(items: readonly BankQuestionInput[]): BankQuestion[] {
  return items.map((item): BankQuestion =>
    Array.isArray(item) && !("key" in (item as object))
      ? {
          key: (item as BankQuestionTuple)[0],
          topic: (item as BankQuestionTuple)[1],
          difficulty: (item as BankQuestionTuple)[2],
          prompt: (item as BankQuestionTuple)[3],
          hints: [...(item as BankQuestionTuple)[4]],
          keywords: [...(item as BankQuestionTuple)[5]],
          model: (item as BankQuestionTuple)[6],
        }
      : (item as BankQuestion),
  );
}

/**
 * Builds an `InterviewTopic` from a mix of full questions and compact tuples.
 * Registration in `./index.ts` is the only place a new technology must be wired.
 */
export function defineTopic(input: {
  id: string;
  label: string;
  description: string;
  questions: readonly BankQuestionInput[];
}): InterviewTopic {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    questions: defineQuestions(input.questions),
  };
}

/** Appends extra (tuple) questions to an existing topic without rewriting it. */
export function extendTopic(
  topic: InterviewTopic,
  extra: readonly BankQuestionInput[],
): InterviewTopic {
  return { ...topic, questions: [...topic.questions, ...defineQuestions(extra)] };
}

/** Uniform Fisher–Yates shuffle. */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}
