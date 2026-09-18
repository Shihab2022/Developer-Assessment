"use client";

import { CheckCircle2, XCircle, Clock, Terminal, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatValue } from "@/lib/practice/compare";
import type { PracticeProblem } from "@/lib/practice/types";
import type { RunSummary } from "@/lib/practice/runner";
import { cn } from "@/lib/utils";

export type Verdict = "accepted" | "wrong-answer" | "runtime-error" | "time-limit" | "compile-error" | "none";

/** Derives the overall verdict from a run summary. */
export function verdictFrom(summary: RunSummary): Verdict {
  if (summary.timedOut) return "time-limit";
  if (!summary.ok) return "compile-error";
  if (summary.total > 0 && summary.passed === summary.total) return "accepted";
  return summary.results.some((result) => result.error) ? "runtime-error" : "wrong-answer";
}

export const VERDICT_STYLES: Record<Verdict, { label: string; tone: string; icon: React.ElementType }> = {
  accepted: { label: "Accepted", tone: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  "wrong-answer": { label: "Wrong Answer", tone: "text-rose-600 dark:text-rose-400", icon: XCircle },
  "runtime-error": { label: "Runtime Error", tone: "text-amber-600 dark:text-amber-400", icon: AlertTriangle },
  "time-limit": { label: "Time Limit Exceeded", tone: "text-amber-600 dark:text-amber-400", icon: Clock },
  "compile-error": { label: "Error", tone: "text-rose-600 dark:text-rose-400", icon: XCircle },
  none: { label: "Not run", tone: "text-muted-foreground", icon: Info },
};

/** Renders input arguments on one line. */
function renderArgs(args: unknown[]): string {
  return args.map((arg) => formatValue(arg, 60)).join(", ");
}

/** Renders the verdict banner, per-case breakdown and captured console output. */
export function TestResults({
  summary,
  problem,
  className,
}: {
  summary: RunSummary;
  problem: PracticeProblem;
  className?: string;
}) {
  const verdict = verdictFrom(summary);
  const style = VERDICT_STYLES[verdict];
  const VerdictIcon = style.icon;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      {/* Verdict banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className={cn("flex items-center gap-2 font-semibold", style.tone)}>
          <VerdictIcon className="size-5" />
          {style.label}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {summary.total > 0 && (
            <Badge tone={summary.passed === summary.total ? "green" : "gray"} size="sm">
              {summary.passed} / {summary.total} tests passed
            </Badge>
          )}
          {summary.durationMs > 0 && (
            <span className="font-mono">{summary.durationMs.toFixed(0)} ms</span>
          )}
          {summary.transpiled && (
            <Badge tone="blue" size="sm">
              TypeScript → JS
            </Badge>
          )}
        </div>
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto">
        {/* Whole-submission failure (syntax error, missing function, timeout) */}
        {summary.error && (
          <div className="border-b border-border bg-destructive/5 px-4 py-3">
            <p className="font-mono text-xs leading-relaxed text-destructive">{summary.error}</p>
            {summary.location && (
              <p className="mt-1 text-[11px] text-muted-foreground">Reported at {summary.location}</p>
            )}
          </div>
        )}

        {/* Per-case breakdown */}
        {summary.results.length > 0 && (
          <ul className="divide-y divide-border">
            {summary.results.map((result) => {
              const testCase = problem.testCases[result.index];
              const isHidden = Boolean(testCase?.isHidden);
              return (
                <li key={result.index} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="size-4 shrink-0 text-rose-500" />
                      )}
                      <span className="font-mono text-xs text-foreground">Case {result.index + 1}</span>
                      {isHidden && (
                        <Badge tone="amber" size="sm">
                          hidden
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {result.durationMs.toFixed(1)} ms
                    </span>
                  </div>

                  {/* Inputs are always shown; the expected output is only revealed
                      for visible cases so hidden tests stay meaningful. */}
                  {testCase && (
                    <div className="mt-2 space-y-1 font-mono text-[11.5px]">
                      <div className="text-muted-foreground">
                        <span className="select-none text-foreground/60">Input: </span>
                        {renderArgs(testCase.args)}
                      </div>
                      {!isHidden && (
                        <div className="text-muted-foreground">
                          <span className="select-none text-foreground/60">Expected: </span>
                          <span className="text-foreground">
                            {formatValue(testCase.expected, 80)}
                          </span>
                        </div>
                      )}
                      {result.actualText !== undefined && (
                        <div className="text-muted-foreground">
                          <span className="select-none text-foreground/60">Output: </span>
                          <span
                            className={
                              result.passed
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {result.actualText}
                          </span>
                        </div>
                      )}
                      {result.error && <div className="text-destructive">{result.error}</div>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Console output */}
        {summary.logs.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Terminal className="size-3.5" />
              Console
            </div>
            <pre className="thin-scrollbar max-h-48 overflow-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-slate-100">
              {summary.logs.join("\n")}
            </pre>
          </div>
        )}

        {/* Empty state */}
        {!summary.error && summary.results.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            Run your code to see the test results.
          </div>
        )}
      </div>
    </div>
  );
}

export default TestResults;