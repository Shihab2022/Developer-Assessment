"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { LANDING_FAQ } from "@/lib/marketing";
import { cn } from "@/lib/utils";

/**
 * Accordion for the landing FAQ. Built with plain buttons so the answers stay
 * in the server-rendered HTML for crawlers even before hydration.
 */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {LANDING_FAQ.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question}>
            <h3>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className="text-sm font-semibold text-foreground sm:text-[15px]">
                  {item.question}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </h3>
            {expanded && (
              <p className="animate-fade-in px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FaqSection;