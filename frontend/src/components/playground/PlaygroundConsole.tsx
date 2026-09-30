"use client";

import { AlertTriangle, CheckCircle2, Clock, Eraser, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ConsoleLine, ResultTable, RunResult } from "@/lib/playground/types";
import { cn } from "@/lib/utils";

/**
 * Console panel for the playground.
 *
 * stdin/stdout for a browser sandbox *is* the console, so the panel reads like
 * a terminal: one line per `console.*` call (or per `print` in Python), an exit
 * status for the whole run, and the captured wall-clock duration.
 */

/** Colour per log level, tuned for the dark console surface. */
const LEVEL_STYLES: Record<ConsoleLine["level"], string> = {
  log: "text-slate-100",
  info: "text-sky-200",
  warn: "text-amber-300",
  error: "text-rose-300",
  system: "text-slate-400 italic",
};

const STATUS_STYLES: Record<
  RunResult["status"],
  { label: string; icon: React.ElementType; tone: string }
> = {
  success: {
    label: "Finished",
    icon: CheckCircle2,
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  error: { label: "Failed", icon: AlertTriangle, tone: "text-rose-600 dark:text-rose-400" },
  timeout: {
    label: "Time limit exceeded",
    icon: Clock,
    tone: "text-amber-600 dark:text-amber-400",
  },
};

/**
 * Run status cluster shown in the output pane's header: a spinner while the run
 * is in flight, the exit status afterwards, and a shortcut to clear the console.
 *
 * Deliberately separate from `PlaygroundConsole` so the workspace can put the
 * pane tabs and this cluster on one row, the way online compilers do.
 */
export interface PlaygroundRunStatusProps {
  result: RunResult | null;
  /** True while a run is in flight. */
  busy: boolean;
  /** Progress text streamed by the runner (Python/SQL runtime download, …). */
  status?: string | null;
  onClear: () => void;
  className?: string;
}

export function PlaygroundRunStatus({
  result,
  busy,
  status,
  onClear,
  className,
}: PlaygroundRunStatusProps) {
  const style = result ? STATUS_STYLES[result.status] : null;
  const StatusIcon = style?.icon;
  const hasLogs = (result?.logs.length ?? 0) > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted-foreground",
        className,
      )}
    >
      {busy && (
        <span className="flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" />
          {status ?? "Running…"}
        </span>
      )}

      {!busy && style && StatusIcon && (
        <span className={cn("flex items-center gap-1.5 font-semibold", style.tone)}>
          <StatusIcon className="size-3.5" />
          {style.label}
        </span>
      )}

      {!busy && result && (
        <>
          <Badge tone={result.status === "success" ? "green" : "red"} size="sm">
            exit {result.exitCode}
          </Badge>
          {result.durationMs > 0 && (
            <span className="font-mono">{result.durationMs.toFixed(0)} ms</span>
          )}
          {result.transpiled && (
            <Badge tone="blue" size="sm">
              TypeScript → JS
            </Badge>
          )}
        </>
      )}

      {hasLogs && !busy && (
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onClear}>
          <Eraser />
          Clear
        </Button>
      )}
    </div>
  );
}

export interface PlaygroundConsoleProps {
  result: RunResult | null;
  /** True while a run is in flight. */
  busy: boolean;
  /** Progress text streamed by the runner (Python/SQL runtime download, …). */
  status?: string | null;
  /** Copy shown before the first run. */
  emptyHint: string;
  className?: string;
}

/**
 * Renders the result sets a SQL run produced, under the console output.
 *
 * Columns come straight from SQLite, so this stays a dumb table: no sorting, no
 * paging, cell values rendered exactly as the database returned them.
 */
function ResultTables({ tables }: { tables: ResultTable[] }) {
  if (tables.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {tables.map((table, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-slate-800">
          <div className="border-b border-slate-800 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Result {index + 1} · {table.rows.length} row{table.rows.length === 1 ? "" : "s"}
          </div>
          <div className="thin-scrollbar overflow-x-auto">
            <table className="w-full border-collapse text-left font-mono text-[12px]">
              <thead>
                <tr>
                  {table.columns.map((column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap border-b border-slate-800 bg-slate-900/60 px-3 py-2 font-semibold text-sky-200"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="odd:bg-slate-900/30">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn(
                          "whitespace-nowrap px-3 py-1.5 text-slate-200",
                          cell === "NULL" && "italic text-slate-500",
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlaygroundConsole({
  result,
  busy,
  status,
  emptyHint,
  className,
}: PlaygroundConsoleProps) {
  const logs = result?.logs ?? [];
  const hasLogs = logs.length > 0;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="thin-scrollbar min-h-0 flex-1 overflow-auto bg-slate-950 px-4 py-3 font-mono text-[12.5px] leading-relaxed">
        {logs.map((line, index) => (
          <div key={`${index}-${line.level}`} className={cn("whitespace-pre-wrap", LEVEL_STYLES[line.level])}>
            {line.level === "log" ? "" : `${line.level}: `}
            {line.text}
          </div>
        ))}

        {result?.error && (
          <div className="mt-2 whitespace-pre-wrap text-rose-300">{result.error}</div>
        )}

        {result?.location && (
          <div className="mt-1 text-[11px] text-slate-400">Reported at {result.location}.</div>
        )}

        <ResultTables tables={result?.tables ?? []} />

        {busy && logs.length === 0 && (
          <div className="text-slate-400">{status ?? "Running…"}</div>
        )}

        {!busy && !hasLogs && !result?.error && (
          <div className="text-slate-400">{emptyHint}</div>
        )}
      </div>
    </div>
  );
}

export default PlaygroundConsole;