import type { CompetitionStatus } from "./types";

export type CompetitionCardTone = "green" | "amber" | "gray";

/** Badge tone for a competition status chip (shared by the public browser). */
export function competitionCardTone(status: CompetitionStatus): CompetitionCardTone {
  if (status === "OPEN") return "green";
  if (status === "CLOSED") return "amber";
  return "gray";
}

export const COMPETITION_ACCESS_LABELS: Record<string, string> = {
  LINK: "Open link",
  CODE: "Invite code",
  INVITE: "Private",
};

