"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { TOKEN_CLASSES, tokenizeCode } from "@/lib/practice/highlight";
import { cn } from "@/lib/utils";

/**
 * Coloured, read-only code sample used by the problem description, examples and
 * hints.
 *
 * The snippet is tokenized with `lib/practice/highlight` and rendered as plain
 * React elements, so a problem in the bank can never inject markup. The copy
 * button appears on hover (and is always available to keyboard users) so rows
 * stay quiet at rest.
 */

export type CodeBlockTone = "slate" | "indigo" | "emerald" | "amber";

const TONES: Record<CodeBlockTone, { frame: string; header: string; label: string }> = {
  slate: {
    frame: "border-border bg-slate-50 dark:bg-slate-900/50",
    header: "border-border/70",
    label: "text-muted-foreground",
  },
  indigo: {
    frame: "border-primary-200/70 bg-primary-50/60 dark:border-primary-900/50 dark:bg-primary-950/25",
    header: "border-primary-200/60 dark:border-primary-900/40",
    label: "text-primary-700 dark:text-primary-300",
  },
  emerald: {
    frame:
      "border-emerald-200/70 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/25",
    header: "border-emerald-200/60 dark:border-emerald-900/40",
    label: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    frame: "border-amber-200/70 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/25",
    header: "border-amber-200/60 dark:border-amber-900/40",
    label: "text-amber-700 dark:text-amber-300",
  },
};

export interface CodeBlockProps {
  /** Source text to colour. */
  code: string;
  /** Optional caption rendered at the top-left, e.g. `Input`. */
  label?: ReactNode;
  /** Optional trailing content in the header (badges, buttons). */
  trailing?: ReactNode;
  tone?: CodeBlockTone;
  /** Show the copy-to-clipboard button. */
  copyable?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  label,
  trailing,
  tone = "slate",
  copyable = true,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const tokens = tokenizeCode(code);
  const palette = TONES[tone];
  const hasHeader = label !== undefined || trailing !== undefined || copyable;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-lg border", palette.frame, className)}>
      {hasHeader && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 border-b px-3 py-1.5",
            palette.header,
          )}
        >
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              palette.label,
            )}
          >
            {label}
          </span>
          <span className="flex items-center gap-1.5">
            {trailing}
            {copyable && (
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
                aria-label={copied ? "Copied" : "Copy code"}
                title={copied ? "Copied" : "Copy"}
              >
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </span>
        </div>
      )}

      <pre className="thin-scrollbar overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-relaxed">
        <code>
          {tokens.map((token, index) => (
            <span key={index} className={TOKEN_CLASSES[token.kind]}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export default CodeBlock;
