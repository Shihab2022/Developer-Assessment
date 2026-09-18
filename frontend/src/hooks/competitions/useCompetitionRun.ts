import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buildRunPlan, createEntrySeed, resolvePaperRows } from "@/lib/competitions/paper";
import { gradeEntry } from "@/lib/competitions/scoring";
import {
  attemptsUsed,
  entryForParticipant,
  useCompetitionsStore,
} from "@/store/competitions";
import type {
  Competition,
  CompetitionEntry,
  ResolvedRowForRun,
} from "@/lib/competitions/run-types";

/**
 * Attempt lifecycle for one competition (requirement 4 — join and sit the
 * paper under the host's rules).
 *
 * Resolves the paper once the banks load, derives the participant's seeded
 * run plan, resumes an in-progress entry when the same identity returns, and
 * grades + stores the summary at submit time so the leaderboard never
 * re-runs candidate code.
 */
export interface CompetitionIdentity {
  participantName: string;
  participantEmail: string;
  organisation: string;
  accessCode: string;
}

export interface UseCompetitionRunArgs {
  competition: Competition;
  identity: CompetitionIdentity | null;
  banks: Record<string, import("@/lib/question-banks/types").QuestionBank>;
  banksReady: boolean;
}

export function useCompetitionRun({ competition, identity, banks, banksReady }: UseCompetitionRunArgs) {
  const router = useRouter();
  const entries = useCompetitionsStore((state) => state.entries);
  const startEntry = useCompetitionsStore((state) => state.startEntry);
  const saveAnswer = useCompetitionsStore((state) => state.saveAnswer);
  const saveCodingProgress = useCompetitionsStore((state) => state.saveCodingProgress);
  const recordProctorEvent = useCompetitionsStore((state) => state.recordProctorEvent);
  const submitEntry = useCompetitionsStore((state) => state.submitEntry);

  const [entryId, setEntryId] = useState<string | null>(null);
  const startedRef = useRef<string | null>(null);

  const rows = useMemo(() => {
    if (!banksReady) return [];
    const ownQuestions = useCompetitionsStore.getState().ownQuestions;
    return resolvePaperRows({ items: competition.items, banks, ownQuestions }).rows;
  }, [banksReady, banks, competition.items]);

  const participantKey = useMemo(() => {
    if (!identity) return null;
    return `${identity.participantName.trim().toLowerCase()}|${identity.participantEmail.trim().toLowerCase()}`;
  }, [identity]);

  const existing = useMemo(() => {
    if (!identity) return undefined;
    return entryForParticipant(entries, competition.id, {
      participantName: identity.participantName,
      participantEmail: identity.participantEmail || undefined,
    });
  }, [entries, competition.id, identity]);

  /* Start (or resume) the entry once the paper is resolved. */
  useEffect(() => {
    if (!identity || !banksReady || rows.length === 0) return;
    if (attemptsUsed(entries, competition, {
      participantName: identity.participantName,
      participantEmail: identity.participantEmail || undefined,
    }) >= competition.rules.maxAttempts && !existing) {
      toast.error("You have used all attempts for this competition.");
      router.replace(`/competitions/${competition.id}`);
      return;
    }
    if (existing && existing.status === "IN_PROGRESS") {
      setEntryId(existing.id);
      startedRef.current = existing.id;
      return;
    }
    if (startedRef.current) return;
    const seed = createEntrySeed();
    const plan = buildRunPlan(rows, competition.rules, seed);
    const entry = startEntry({
      competitionId: competition.id,
      participantName: identity.participantName.trim(),
      participantEmail: identity.participantEmail.trim() || undefined,
      organisation: identity.organisation.trim() || undefined,
      plan,
      seed,
    });
    startedRef.current = entry.id;
    setEntryId(entry.id);
  }, [identity, banksReady, rows, entries, competition, existing, startEntry, router]);

  const entry: CompetitionEntry | undefined = useMemo(
    () => entries.find((item) => item.id === entryId) ?? existing,
    [entries, entryId, existing],
  );

  const orderedRows: ResolvedRowForRun[] = useMemo(() => {
    if (rows.length === 0) return [];
    const order = entry?.questionOrder?.length ? entry.questionOrder : rows.map((row) => row.itemId);
    const byId = new Map(rows.map((row) => [row.itemId, row]));
    const ordered: ResolvedRowForRun[] = [];
    order.forEach((itemId, index) => {
      const row = byId.get(itemId);
      if (row) ordered.push({ row, order: index });
    });
    return ordered;
  }, [rows, entry]);

  const answer = useCallback(
    (itemId: string, value: string) => {
      if (entry) saveAnswer(entry.id, itemId, value);
    },
    [entry, saveAnswer],
  );

  const saveCode = useCallback(
    (itemId: string, code: string, passed: number, total: number) => {
      if (entry) saveCodingProgress(entry.id, itemId, { code, passed, total });
    },
    [entry, saveCodingProgress],
  );

  const proctor = useCallback(
    (type: string) => {
      if (entry && competition.rules.antiCheat) recordProctorEvent(entry.id, type);
    },
    [entry, competition.rules.antiCheat, recordProctorEvent],
  );

  const submit = useCallback(() => {
    if (!entry) return null;
    const summary = gradeEntry(rows, entry, competition.rules);
    submitEntry(entry.id, {
      score: summary.score,
      maxScore: summary.maxScore,
      percent: summary.percent,
      passed: summary.passed,
      correctCount: summary.correctCount,
      totalCount: summary.totalCount,
      needsReview: summary.needsReview,
    });
    return entry.id;
  }, [entry, rows, competition.rules, submitEntry]);

  return {
    rows,
    orderedRows,
    entry,
    participantKey,
    answer,
    saveCode,
    proctor,
    submit,
  };
}

export default useCompetitionRun;

