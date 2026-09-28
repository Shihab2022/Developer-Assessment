import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ExamShell } from "@/components/exams/ExamShell";
import { CompetitionsBrowser } from "@/components/competitions/CompetitionsBrowser";
import { COMPETITION_HERO_CARDS, type CompetitionHeroCard } from "@/lib/competitions/landing";


export default function CompetitionsPage() {
  return (
    <ExamShell>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          eyebrow="Competitions"
          title="Sit timed competition papers"
          description="One paper, one clock, one leaderboard. Public competitions are assembled from our shared question banks or a company's own questions."
          className="mb-12"
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Users className="size-4" />
          <span>Open competitions are coming soon.</span>
        </div>

        {COMPETITION_HERO_CARDS.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMPETITION_HERO_CARDS.map((card, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center py-24 text-center text-sm text-muted-foreground">
            <p>No competitions published yet.</p>
          </div>
        )}
      </div>
    </ExamShell>
  );
}
