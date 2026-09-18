import dynamic from "next/dynamic";
import type { ResolvedRow } from "@/lib/competitions/paper";
import type { Competition, CompetitionEntry, OwnQuestion } from "@/lib/competitions/types";

export type { Competition, CompetitionEntry, OwnQuestion, ResolvedRow };

/** A resolved row with its presentation order attached (attempt player state). */
export interface OrderedRow {
  row: ResolvedRow;
  index: number;
}

export interface ResolvedRowForRun {
  row: ResolvedRow;
  order: number;
}

export interface IdentityForm {
  participantName: string;
  participantEmail: string;
  organisation: string;
  accessCode: string;
}

export interface AttemptIdentity extends IdentityForm {
  agreed: boolean;
}

export interface RunState {
  competition: Competition;
  identity: AttemptIdentity;
  entry: CompetitionEntry;
  rows: ResolvedRow[];
  orderedRows: OrderedRow[];
}

export interface CodingDraft {
  code: string;
  language: "javascript" | "typescript";
}

export interface OwnQuestionForReview extends OwnQuestion {
  itemId: string;
  points: number;
}
