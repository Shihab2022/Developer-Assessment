import type { Difficulty } from "@/lib/types";

/**
 * Competition domain types (requirement 4 & 5).
 *
 * A competition is a paper assembled from three sources — our MCQ banks, our
 * coding problem bank, and questions the host company authored — plus the rules
 * that govern the attempt. Everything is stored client-side in the persisted
 * competitions store, mirroring how the exam and practice features work.
 */

export type CompetitionStatus = "DRAFT" | "OPEN" | "CLOSED";

/** How participants are admitted. */
export type CompetitionAccess = "LINK" | "CODE" | "INVITE";

/** Where a paper row came from. */
export type PaperSource = "library-mcq" | "library-coding" | "own";

export type OwnQuestionType = "MCQ" | "CODING" | "WRITTEN";

/** One row of a competition paper (the ordering is the presentation order). */
export interface PaperItem {
  /** Unique within the competition (also the answer key in stored entries). */
  id: string;
  source: PaperSource;
  /** Points this row contributes to the total. */
  points: number;
  /** `library-mcq`: which bank the question lives in. */
  technology?: string;
  /** `library-mcq` / `library-coding`: id inside the built-in library. */
  questionId?: string;
  problemId?: string;
  /** `own`: id of the company-authored question. */
  ownId?: string;
}

export interface CompetitionRules {
  durationMinutes: number;
  /** ISO timestamps — the window during which the competition can be joined. */
  opensAt?: string;
  closesAt?: string;
  access: CompetitionAccess;
  maxAttempts: number;
  passPercent: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  /** Show the live leaderboard to participants. */
  showLeaderboard: boolean;
  /** Reveal the correct answers on the result screen. */
  showExplanations: boolean;
  /** Record tab-switch / copy events during the attempt. */
  antiCheat: boolean;
}

export interface Competition {
  id: string;
  title: string;
  /** Company, university or club running the contest. */
  organiser: string;
  description: string;
  status: CompetitionStatus;
  /** Human-friendly code used for `LINK` / `CODE` access. */
  inviteCode: string;
  /** Base seed for paper shuffling. */
  seed: number;
  tags: string[];
  rules: CompetitionRules;
  items: PaperItem[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
}

/* ------------------------------------------------------- authored questions */

export interface OwnQuestionOption {
  id: string;
  text: string;
}

export interface OwnCodingTestCase {
  args: unknown[];
  expected: unknown;
  isHidden?: boolean;
}

/** A question authored by a company — usable in competitions and exams. */
export interface OwnQuestion {
  id: string;
  type: OwnQuestionType;
  title: string;
  /** Markdown-ish prompt (inline backticks are rendered as `code`). */
  prompt: string;
  difficulty: Difficulty;
  topic: string;
  createdAt: string;
  updatedAt: string;
  /** Set when the question was forked out of the built-in library. */
  importedFrom?: string;
  explanation?: string;

  /* MCQ */
  options?: OwnQuestionOption[];
  correctOptionId?: string;

  /* CODING */
  coding?: {
    language: "javascript" | "typescript";
    functionName: string;
    starterCode: { javascript: string; typescript: string };
    testCases: OwnCodingTestCase[];
  };

  /* Written answers */
  written?: {
    /** Reference answer the reviewer compares against. */
    referenceAnswer?: string;
    maxWords?: number;
  };
}

export type { Difficulty };

/* ---------------------------------------------------------- participants */

export type EntryStatus = "IN_PROGRESS" | "SUBMITTED";

export interface CodingProgress {
  code: string;
  passed: number;
  total: number;
}

export interface CompetitionEntry {
  id: string;
  competitionId: string;
  participantName: string;
  participantEmail?: string;
  organisation?: string;
  status: EntryStatus;
  startedAt: string;
  submittedAt?: string;
  /** Per-participant seed: same paper, different order. */
  seed: number;
  /** Paper row ids in this participant's presentation order. */
  questionOrder: string[];
  /** Paper row id -> shuffled option ids. */
  optionOrders: Record<string, string[]>;
  /** Paper row id -> chosen option id (MCQ) or written answer. */
  answers: Record<string, string>;
  /** Paper row id -> coding progress. */
  coding: Record<string, CodingProgress>;
  /** Manual scores for written answers, keyed by paper row id. */
  manualScores: Record<string, number>;
  /** Anti-cheat signals recorded during the attempt. */
  proctorEvents: { type: string; at: string }[];
  /** Set at submit time: a written answer is still awaiting manual scoring. */
  needsReview?: boolean;

  /* Derived at submit time so the leaderboard never re-runs code. */
  score?: number;
  maxScore?: number;
  percent?: number;
  passed?: boolean;
  correctCount?: number;
  totalCount?: number;
}