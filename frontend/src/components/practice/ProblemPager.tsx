"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DIFFICULTY_LABELS, STATUS_TONES } from "@/lib/constants";
import type { Difficulty } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

/**
 * Previous / next problem navigation.
 *
 * A bare chevron icon tells the reader nothing, so each side is a full-width
 * card that names the neighbouring problem and its difficulty. The edges of the
 * bank render as a disabled card instead of disappearing, which keeps the
 * layout stable when jumping between problems.
 */

export interface ProblemLink {
  id: string;
  number: number;
  title: string;
  difficulty: Difficulty;
}

export interface ProblemPagerProps {
  previous?: ProblemLink;
  next?: ProblemLink;
  /** One-based position of the current problem in the bank. */
  position?: number;
  total?: number;
  className?: string;
}

function PagerCard({
  link,
  direction,
}: {
  link?: ProblemLink;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  const label = isNext ? "Next problem" : "Previous problem";

  if (!link) {
    return (
      <div
        className="flex flex-1 cursor-not-allowed items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-muted-foreground/70"
        aria-disabled="true"
      >
        {!isNext && <ChevronLeft className="size-4 shrink-0" />}
        <span className="min-w-0 flex-1 text-xs font-medium">
          {isNext ? "End of the arena" : "Start of the arena"}
        </span>
        {isNext && <ChevronRight className="size-4 shrink-0" />}
      </div>
    );
  }

  return (
    <Link
      href={`/practice/${link.id}`}
      title={`${link.number}. ${link.title}`}
      className={cn(
        "group flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors",
        "hover:border-primary-300 hover:bg-primary-50/60 dark:hover:border-primary-900 dark:hover:bg-primary-950/30",
      )}
    >
      {!isNext && (
        <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
      )}
      <span className={cn("min-w-0 flex-1", isNext && "text-right")}>
        <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
          <span className={cn("flex min-w-0 items-center gap-1.5", isNext && "justify-end")}>
            <span className="truncate group-hover:underline">
              {link.number}. {link.title}
            </span>
            <Badge tone={STATUS_TONES[link.difficulty] ?? "gray"} size="sm">
              {DIFFICULTY_LABELS[link.difficulty] ?? link.difficulty}
            </Badge>
          </span>
        </span>
      </span>
      {isNext && (
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}

export function ProblemPager({ previous, next, position, total, className }: ProblemPagerProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-stretch gap-2">
        <PagerCard link={previous} direction="previous" />
        <PagerCard link={next} direction="next" />
      </div>
      {position && total ? (
        <p className="text-center text-[11px] text-muted-foreground">
          Problem {position} of {total} in the arena
        </p>
      ) : null}
    </div>
  );
}

export default ProblemPager;
