"use client";

import { useMemo, useState } from "react";
import { Compass, Eye, Gauge, Lightbulb, ListChecks, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RichText } from "@/components/practice/RichText";
import { guidedHintSections, type HintIcon } from "@/lib/practice/hints";
import type { PracticeProblem } from "@/lib/practice/types";

/**
 * Hints tab.
 *
 * Two layers, so a useful hint always exists even when a problem's authored
 * hints are thin:
 *
 * 1. **Guided sections** derived from the problem itself (`guidedHintSections`)
 *    — approach, a step-by-step plan, edge cases and the target complexity.
 * 2. **Authored hints** from the bank, revealed one at a time so a learner can
 *    stop as soon as they are unblocked.
 */

const ICONS: Record<HintIcon, React.ElementType> = {
  compass: Compass,
  list: ListChecks,
  shield: ShieldAlert,
  gauge: Gauge,
};

const TONES: Record<HintIcon, { frame: string; icon: string }> = {
  compass: {
    frame:
      "border-primary-200/70 bg-primary-50/40 dark:border-primary-900/50 dark:bg-primary-950/20",
    icon: "text-primary-600 dark:text-primary-300",
  },
  list: {
    frame: "border-border bg-muted/40",
    icon: "text-sky-600 dark:text-sky-300",
  },
  shield: {
    frame: "border-amber-200/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
    icon: "text-amber-600 dark:text-amber-300",
  },
  gauge: {
    frame:
      "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20",
    icon: "text-emerald-600 dark:text-emerald-300",
  },
};

export function HintsPanel({ problem }: { problem: PracticeProblem }) {
  const sections = useMemo(() => guidedHintSections(problem), [problem]);
  const authored = problem.hints;
  const [revealed, setRevealed] = useState(0);
  const allRevealed = revealed >= authored.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Lightbulb className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Guided hints</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Built from this problem&apos;s topics and constraints — start here when you feel stuck.
            </p>
          </div>
        </div>
        <Badge tone="amber" size="sm">
          {revealed} of {authored.length} step hints shown
        </Badge>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = ICONS[section.icon];
          const tone = TONES[section.icon];
          return (
            <section key={section.id} className={`rounded-xl border p-4 sm:p-5 ${tone.frame}`}>
              <header className="flex items-center gap-2">
                <Icon className={`size-4 ${tone.icon}`} />
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              </header>
              <p className="mt-1 text-xs text-muted-foreground">{section.summary}</p>
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet, index) => (
                  <li key={index} className="flex gap-2 text-sm leading-relaxed">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                    <RichText text={bullet} className="text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </section>
          );
      {/* Authored, progressive hints */}
      <div className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="size-4 text-violet-600 dark:text-violet-300" />
            Worked hints
          </h3>
          {revealed > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setRevealed(0)}>
              <Eye className="size-3.5" />
              Hide all
            </Button>
          )}
        </div>

        {revealed === 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {authored.length === 1
              ? "Reveal the hint when you want a nudge in the right direction."
              : "Reveal one hint at a time — each one gives a little more away than the last."}
          </p>
        )}

        <ol className="space-y-3">
          {authored.slice(0, revealed).map((hint, index) => (
            <li
              key={index}
              className="rounded-xl border border-violet-200/70 bg-violet-50/50 p-4 dark:border-violet-900/50 dark:bg-violet-950/20"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                Hint {index + 1} of {authored.length}
              </p>
              <RichText text={hint} className="mt-1 text-foreground/90" />
            </li>
          ))}
        </ol>

        {!allRevealed ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setRevealed((count) => count + 1)}>
              <Lightbulb />
              Reveal hint {revealed + 1}
            </Button>
            {authored.length - revealed > 1 && (
              <Button variant="outline" onClick={() => setRevealed(authored.length)}>
                <Eye />
                Reveal all {authored.length}
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            That is every hint for this problem. If you are still stuck, open the{" "}
            <span className="font-medium text-foreground">Description</span> tab and work the first
            example by hand.
          </p>
        )}
      </div>
    </div>
  );
}

export default HintsPanel;

