import { Clock, ListOrdered, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CompetitionHeroCard {
  icon: LucideIcon;
  title: string;
  body: string;
}

/** Explainer cards above the public competition browser. */
export const COMPETITION_HERO_CARDS: CompetitionHeroCard[] = [
  {
    icon: Clock,
    title: "One clock for everyone",
    body: "Duration, open window and attempt limits are enforced per competition, and the countdown survives reloads.",
  },
  {
    icon: ListOrdered,
    title: "Mixed papers",
    body: "Papers mix our MCQ banks, coding problems and the host's own questions — each participant sees them in a seeded order.",
  },
  {
    icon: Trophy,
    title: "Ranked live",
    body: "Scores combine MCQ accuracy, coding test cases and reviewed written answers into one leaderboard.",
  },
];
