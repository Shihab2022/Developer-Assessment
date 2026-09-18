"use client";

import { CalendarClock, ListOrdered, Timer, Trophy } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import type { Competition } from "@/lib/competitions/types";
import { formatDateTime, pluralize } from "@/lib/utils";

/** Fact cards on the public competition page (duration, paper, window). */
export function CompetitionMetaCards({ competition }: { competition: Competition }) {
  const cards = [
    {
      icon: Timer,
      label: "Duration",
      value: `${competition.rules.durationMinutes} minutes`,
    },
    {
      icon: ListOrdered,
      label: "Paper",
      value: `${competition.items.length} ${pluralize(competition.items.length, "question")}`,
    },
    {
      icon: CalendarClock,
      label: "Open window",
      value: competition.rules.closesAt
        ? `Closes ${formatDateTime(competition.rules.closesAt)}`
        : "Open until closed",
    },
    {
      icon: Trophy,
      label: "Pass mark",
      value: `${competition.rules.passPercent}%`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardBody className="flex items-center gap-3 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40">
              <card.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">{card.label}</span>
              <span className="block truncate text-sm font-semibold text-foreground">
                {card.value}
              </span>
            </span>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export default CompetitionMetaCards;

