"use client";

import { Hash } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CodeBlock } from "@/components/practice/CodeBlock";
import type { ProblemExample } from "@/lib/practice/types";

/**
 * One worked example from the problem description.
 *
 * Input and output are rendered as *code*, each with its own colour and an
 * inline copy button, so a reader can paste `nums = [2,7,11,15]` straight into
 * the editor instead of retyping it. The explanation keeps inline ``code``
 * formatting and is deliberately quieter than the code blocks.
 */
export function ExampleCard({
  example,
  index,
  functionName,
}: {
  example: ProblemExample;
  /** Zero-based position in `problem.examples`. */
  index: number;
  /** Used as the call signature hint in the footer line. */
  functionName?: string;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Hash className="size-3.5 text-primary-600" />
          Example {index + 1}
        </h3>
        {functionName && (
          <Badge tone="gray" size="sm" className="font-mono">
            {functionName}()
          </Badge>
        )}
      </header>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <CodeBlock code={example.input} label="Input" tone="indigo" />
        <CodeBlock code={example.output} label="Output" tone="emerald" />
      </div>

      {example.explanation && (
        <div className="border-t border-dashed border-border px-4 py-3 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Why
          </p>
          <CodeBlock
            code={example.explanation}
            tone="amber"
            copyable={false}
            className="mt-2 border-0 bg-transparent dark:bg-transparent"
          />
        </div>
      )}
    </article>
  );
}

export default ExampleCard;
