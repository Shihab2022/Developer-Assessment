import { toCsv } from "@/lib/utils";
import type { ResolvedRow } from "./paper";
import type { Competition, CompetitionEntry, CompetitionRules } from "./types";

/**
 * Scoring (requirements 4 & 6).
 *
 * MCQ rows are exact-match, coding rows earn proportional credit for the test
 * cases they pass (the practice runner reports `passed/total`), and written
 * rows stay "awaiting review" until the organiser types a manual score. Scores
 * are written onto the entry at submit time so the leaderboard never re-runs
 * candidate code.
 */

export interface ScoredRow {
  itemId: string;
  kind: "mcq" | "coding" | "written";
  title: string;
  points: number;
  /** `null` while a written answer is awaiting manual review. */
  earned: number | null;
  max: number;
  /** MCQ: picked the right option. Coding: passed every test case. */
  correct: boolean;
  answered: boolean;
  needsReview: boolean;
  detail?: string;
}

export interface ScoreSummary {
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  /** True when at least one written answer is still awaiting manual scoring. */
  needsReview: boolean;
  rows: ScoredRow[];
}

export function gradeEntry(
  rows: ResolvedRow[],
  entry: CompetitionEntry,
  rules: CompetitionRules,
): ScoreSummary {
  const scored: ScoredRow[] = rows.map((row) => {
    const base = { itemId: row.itemId, kind: row.kind, points: row.points, max: row.points };

    if (row.kind === "mcq") {
      const chosen = entry.answers[row.itemId];
      const answered = Boolean(chosen);
      const correct = answered && chosen === row.correctOptionId;
      return {
        ...base,
        title: row.title,
        earned: correct ? row.points : 0,
        correct: Boolean(correct),
        answered,
        needsReview: false,
        detail: answered ? (correct ? "Correct answer" : "Wrong answer") : "Not answered",
      };
    }

    if (row.kind === "coding") {
      const progress = entry.coding[row.itemId];
      const total = row.testCases.length;
      const passed = progress?.passed ?? 0;
      const ratio = total > 0 ? passed / total : 0;
      return {
        ...base,
        title: row.problem.title,
        earned: Math.round(row.points * ratio * 100) / 100,
        correct: total > 0 && passed === total,
        answered: Boolean(progress?.code?.trim()),
        needsReview: false,
        detail: `${passed}/${total} test cases passed`,
      };
    }

    const answer = entry.answers[row.itemId] ?? "";
    const manual = entry.manualScores[row.itemId];
    const reviewed = typeof manual === "number";
    return {
      ...base,
      title: row.title,
      earned: reviewed ? manual : null,
      correct: reviewed && manual >= row.points,
      answered: answer.trim().length > 0,
      needsReview: !reviewed,
      detail: reviewed
        ? `Reviewer scored ${manual}/${row.points}`
        : answer.trim()
          ? "Awaiting review"
          : "Not answered",
    };
  });

  const score = scored.reduce((sum, row) => sum + (row.earned ?? 0), 0);
  const maxScore = scored.reduce((sum, row) => sum + row.max, 0);
  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const needsReview = scored.some((row) => row.needsReview);

  return {
    score: Math.round(score * 100) / 100,
    maxScore,
    percent,
    passed: percent >= rules.passPercent,
    correctCount: scored.filter((row) => row.correct).length,
    totalCount: scored.length,
    needsReview,
    rows: scored,
  };
}

/* ------------------------------------------------------------- leaderboard */

export interface LeaderboardRow {
  rank: number;
  participantName: string;
  organisation: string;
  participantEmail: string;
  status: CompetitionEntry["status"];
  submittedAt: string;
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean | "";
  correctCount: number;
  totalCount: number;
  needsReview: boolean;
}

/** Ranked view of a competition's entries — finished first, highest score first. */
export function leaderboardRows(entries: CompetitionEntry[]): LeaderboardRow[] {
  return rankEntries(entries).map((entry, index) => ({
    rank: index + 1,
    participantName: entry.participantName,
    organisation: entry.organisation ?? "",
    participantEmail: entry.participantEmail ?? "",
    status: entry.status,
    submittedAt: entry.submittedAt ?? "",
    score: entry.score ?? 0,
    maxScore: entry.maxScore ?? 0,
    percent: entry.percent ?? 0,
    passed: entry.status === "SUBMITTED" ? Boolean(entry.passed) : "",
    correctCount: entry.correctCount ?? 0,
    totalCount: entry.totalCount ?? 0,
    needsReview: Boolean(entry.needsReview),
  }));
}

/** Stable ranking: finished entries first, then score, then earliest submit. */
export function rankEntries(entries: CompetitionEntry[]): CompetitionEntry[] {
  return [...entries].sort((a, b) => {
    const aDone = a.status === "SUBMITTED" ? 1 : 0;
    const bDone = b.status === "SUBMITTED" ? 1 : 0;
    if (aDone !== bDone) return bDone - aDone;

    const scoreDiff = (b.score ?? -1) - (a.score ?? -1);
    if (scoreDiff !== 0) return scoreDiff;

    if (a.submittedAt && b.submittedAt) {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
    return a.participantName.localeCompare(b.participantName);
  });
}

/** CSV export for the judging panel (requirement 6). */
export function leaderboardCsv(competition: Competition, entries: CompetitionEntry[]): string {
  const rows = leaderboardRows(entries).map((row) => ({
    competition: competition.title,
    ...row,
  }));
  return toCsv(rows as unknown as Record<string, unknown>[]);
}