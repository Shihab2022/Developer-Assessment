"use client";

import { AlertTriangle, CheckCircle2, Clock, Eraser, Loader2, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ConsoleLine, RunResult } from "@/lib/playground/types";
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

export interface PlaygroundConsoleProps {
  result: RunResult | null;
  /** True while a run is in flight. */
  busy: boolean;
  /** Progress text streamed by the runner (Python runtime download, …). */
  status?: string | null;
  /** Copy shown before the first run. */
  emptyHint: string;
  onClear: () => void;
  className?: string;
}

export function PlaygroundConsole({
  result,
  busy,
  status,
  emptyHint,
  onClear,
  className,
}: PlaygroundConsoleProps) {
  const style = result ? STATUS_STYLES[result.status] : null;
  const StatusIcon = style?.icon;
  const logs = result?.logs ?? [];
  const hasLogs = logs.length > 0;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Terminal className="size-3.5" />
          Output
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
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
      </div>

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