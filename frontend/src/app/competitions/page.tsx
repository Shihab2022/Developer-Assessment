import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ExamShell } from "@/components/exams/ExamShell";
import { CompetitionsBrowser } from "@/components/competitions/CompetitionsBrowser";
import { COMPETITION_HERO_CARDS } from "@/lib/competitions/landing";

export const metadata: Metadata = {
  title: "Open competitions — DevAssess",
  description:
    "Join a time-boxed coding competition: one paper, one clock, one leaderboard. Built from the shared question banks or a company's own questions.",
};
