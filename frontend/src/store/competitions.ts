import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import { createInviteCode } from "@/lib/competitions/paper";
import type {
  CodingProgress,
  Competition,
  CompetitionEntry,
  CompetitionRules,
  OwnQuestion,
  PaperItem,
} from "@/lib/competitions/types";

/**
 * Competition store (requirements 4, 5 & 6).
 *
 * Hosted competitions, the company's own question bank and participant entries
 * all live in one persisted store, mirroring the exam and practice stores. When
 * the platform is wired to the REST API this file is the only thing that needs
 * to change — the pages and components speak to it through these actions.
 */

export interface CreateCompetitionInput {
  title: string;
  organiser: string;
  description: string;
  tags: string[];
  rules: CompetitionRules;
  items: PaperItem[];
  seed: number;
}

export interface UpdateCompetitionInput {
  title?: string;
  organiser?: string;
  description?: string;
  tags?: string[];
  rules?: CompetitionRules;
  items?: PaperItem[];
  seed?: number;
  inviteCode?: string;
}

export interface StartEntryInput {
  competitionId: string;
  participantName: string;
  participantEmail?: string;
  organisation?: string;
  plan: { questionOrder: string[]; optionOrders: Record<string, string[]> };
  seed: number;
}

export interface SubmitSummary {
  score: number;
  maxScore: number;
  percent: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  needsReview: boolean;
}

function createId(prefix: string): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) return `${prefix}-${cryptoRef.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface CompetitionsState {
  competitions: Competition[];
  ownQuestions: OwnQuestion[];
  entries: CompetitionEntry[];

  /* host */
  createCompetition: (input: CreateCompetitionInput) => Competition;
  updateCompetition: (id: string, patch: UpdateCompetitionInput) => void;
  removeCompetition: (id: string) => void;
  duplicateCompetition: (id: string) => Competition | undefined;
  publishCompetition: (id: string) => void;
  closeCompetition: (id: string) => void;

  /* own question bank */
  upsertQuestion: (question: OwnQuestion) => void;
  removeQuestion: (id: string) => void;

  /* participants */
  startEntry: (input: StartEntryInput) => CompetitionEntry;
  saveAnswer: (entryId: string, itemId: string, value: string) => void;
  saveCodingProgress: (entryId: string, itemId: string, progress: CodingProgress) => void;
  recordProctorEvent: (entryId: string, type: string) => void;
  submitEntry: (entryId: string, summary: SubmitSummary) => void;
  setManualScore: (entryId: string, itemId: string, points: number) => void;
  removeEntry: (entryId: string) => void;
  reset: () => void;
}

export const useCompetitionsStore = create<CompetitionsState>()(
  persist(
    (set) => ({
      competitions: [],
      ownQuestions: [],
      entries: [],

      /* ---------------------------------------------------------- host */

      createCompetition: (input) => {
        const now = new Date().toISOString();
        const competition: Competition = {
          id: createId("comp"),
          title: input.title,
          organiser: input.organiser,
          description: input.description,
          status: "DRAFT",
          inviteCode: createInviteCode(),
          seed: input.seed,
          tags: input.tags,
          rules: input.rules,
          items: input.items,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ competitions: [competition, ...state.competitions] }));
        return competition;
      },

      updateCompetition: (id, patch) =>
        set((state) => ({
          competitions: state.competitions.map((competition) =>
            competition.id === id
              ? { ...competition, ...patch, updatedAt: new Date().toISOString() }
              : competition,
          ),
        })),

      removeCompetition: (id) =>
        set((state) => ({
          competitions: state.competitions.filter((competition) => competition.id !== id),
          entries: state.entries.filter((entry) => entry.competitionId !== id),
        })),

      duplicateCompetition: (id) => {
        const source = useCompetitionsStore
          .getState()
          .competitions.find((competition) => competition.id === id);
        if (!source) return undefined;

        const now = new Date().toISOString();
        const copy: Competition = {
          ...source,
          id: createId("comp"),
          title: `${source.title} (copy)`,
          status: "DRAFT",
          inviteCode: createInviteCode(),
          createdAt: now,
          updatedAt: now,
          publishedAt: undefined,
          closedAt: undefined,
          items: source.items.map((item) => ({ ...item })),
          rules: { ...source.rules },
        };
        set((state) => ({ competitions: [copy, ...state.competitions] }));
        return copy;
      },

      publishCompetition: (id) =>
        set((state) => ({
          competitions: state.competitions.map((competition) =>
            competition.id === id
              ? {
                  ...competition,
                  status: "OPEN",
                  publishedAt: competition.publishedAt ?? new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : competition,
          ),
        })),

      closeCompetition: (id) =>
        set((state) => ({
          competitions: state.competitions.map((competition) =>
            competition.id === id
              ? {
                  ...competition,
                  status: "CLOSED",
                  closedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : competition,
          ),
        })),

      /* ----------------------------------------------- own question bank */

      upsertQuestion: (question) =>
        set((state) => {
          const existing = state.ownQuestions.findIndex((entry) => entry.id === question.id);
          if (existing === -1) return { ownQuestions: [question, ...state.ownQuestions] };
          const next = [...state.ownQuestions];
          next[existing] = question;
          return { ownQuestions: next };
        }),

      removeQuestion: (id) =>
        set((state) => ({
          ownQuestions: state.ownQuestions.filter((question) => question.id !== id),
          competitions: state.competitions.map((competition) => ({
            ...competition,
            items: competition.items.filter((item) => item.ownId !== id),
          })),
        })),

      /* ---------------------------------------------------- participants */

      startEntry: (input) => {
        const entry: CompetitionEntry = {
          id: createId("entry"),
          competitionId: input.competitionId,
          participantName: input.participantName,
          participantEmail: input.participantEmail,
          organisation: input.organisation,
          status: "IN_PROGRESS",
          startedAt: new Date().toISOString(),
          seed: input.seed,
          questionOrder: input.plan.questionOrder,
          optionOrders: input.plan.optionOrders,
          answers: {},
          coding: {},
          manualScores: {},
          proctorEvents: [],
        };
        set((state) => ({ entries: [entry, ...state.entries] }));
        return entry;
      },

      saveAnswer: (entryId, itemId, value) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, answers: { ...entry.answers, [itemId]: value } }
              : entry,
          ),
        })),

      saveCodingProgress: (entryId, itemId, progress) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, coding: { ...entry.coding, [itemId]: progress } }
              : entry,
          ),
        })),

      recordProctorEvent: (entryId, type) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  proctorEvents: [...entry.proctorEvents, { type, at: new Date().toISOString() }],
                }
              : entry,
          ),
        })),

      submitEntry: (entryId, summary) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId && entry.status === "IN_PROGRESS"
              ? {
                  ...entry,
                  status: "SUBMITTED",
                  submittedAt: new Date().toISOString(),
                  ...summary,
                }
              : entry,
          ),
        })),

      setManualScore: (entryId, itemId, points) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === entryId
              ? { ...entry, manualScores: { ...entry.manualScores, [itemId]: points } }
              : entry,
          ),
        })),

      removeEntry: (entryId) =>
        set((state) => ({ entries: state.entries.filter((entry) => entry.id !== entryId) })),

      reset: () => set({ competitions: [], ownQuestions: [], entries: [] }),
    }),
    {
      name: "devassess-competitions",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/* ------------------------------------------------------------------ helpers */

/**
 * True once the persisted store has rehydrated.
 *
 * Mirrors `useExamsHydrated` / `usePracticeHydrated`: starts `false` on the
 * server and the first client render so markup matches, then flips in an effect.
 */
export function useCompetitionsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useCompetitionsStore.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    setHydrated(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

export function competitionById(
  competitions: Competition[],
  id: string | undefined,
): Competition | undefined {
  if (!id) return undefined;
  return competitions.find((competition) => competition.id === id);
}

export function entriesFor(entries: CompetitionEntry[], competitionId: string): CompetitionEntry[] {
  return entries.filter((entry) => entry.competitionId === competitionId);
}

export function entryById(entries: CompetitionEntry[], id: string | undefined): CompetitionEntry | undefined {
  if (!id) return undefined;
  return entries.find((entry) => entry.id === id);
}

/** Stable participant identity key (email when given, otherwise the name). */
export function participantKey(entry: Pick<CompetitionEntry, "participantName" | "participantEmail">): string {
  return (entry.participantEmail ?? entry.participantName).trim().toLowerCase();
}

/** Existing entry for this participant, if any (used to resume an attempt). */
export function entryForParticipant(
  entries: CompetitionEntry[],
  competitionId: string,
  identity: { participantName: string; participantEmail?: string },
): CompetitionEntry | undefined {
  const key = participantKey(identity);
  return entriesFor(entries, competitionId).find(
    (entry) => participantKey(entry) === key,
  );
}

/** Attempts this participant has already used against the competition's limit. */
export function attemptsUsed(
  entries: CompetitionEntry[],
  competition: Competition,
  identity: { participantName: string; participantEmail?: string },
): number {
  const key = participantKey(identity);
  return entriesFor(entries, competition.id).filter(
    (entry) => participantKey(entry) === key,
  ).length;
}

/** True when `code` matches the competition's invite code (case/space tolerant). */
export function accessCodeMatches(competition: Competition, code: string): boolean {
  return competition.inviteCode.replace(/[\s-]/g, "").toUpperCase() ===
    code.replace(/[\s-]/g, "").toUpperCase();
}