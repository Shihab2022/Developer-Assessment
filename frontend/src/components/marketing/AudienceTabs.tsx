"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Building2, GraduationCap, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LANDING_AUDIENCES } from "@/lib/marketing";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  companies: Building2,
  institutes: GraduationCap,
  candidates: UserRound,
};

/**
 * Role switcher for the "who is this for" section — companies, institutes and
 * candidates each get their own pitch without three separate pages.
 */
export function AudienceTabs() {
  const [active, setActive] = useState(LANDING_AUDIENCES[0]!.id);
  const audience = LANDING_AUDIENCES.find((item) => item.id === active) ?? LANDING_AUDIENCES[0]!;

  return (
    <div className="panel overflow-hidden">
      <div
        role="tablist"
        aria-label="Who the platform is for"
        className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2"
      >
        {LANDING_AUDIENCES.map((item) => {
          const Icon = ICON_MAP[item.id] ?? UserRound;
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(item.id)}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  item.kind === "B2B"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
                )}
              >
                {item.kind}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={audience.kind === "B2B" ? "indigo" : "green"} size="sm">
              {audience.kind}
            </Badge>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {audience.kind === "B2B" ? "For organisations" : "For individuals"}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {audience.headline}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {audience.description}
          </p>
          <Button asChild className="mt-6">
            <Link href={audience.cta.href}>
              {audience.cta.label}
              <ArrowRight />
            </Link>
          </Button>
        </div>

        <ul className="grid gap-3">
          {audience.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-3 text-sm text-foreground">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                <Check className="size-3" strokeWidth={3} />
              </span>
              <span className="leading-relaxed text-muted-foreground">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AudienceTabs;