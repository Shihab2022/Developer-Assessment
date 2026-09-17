"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Play, RotateCcw, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLAYGROUND_DEMOS, type PlaygroundDemo } from "@/lib/marketing";
import { cn } from "@/lib/utils";

/**
 * Marketing preview of the editor + runner.
 *
 * The snippets are static content from `lib/marketing.ts` — nothing is sent to
 * the sandbox from the landing page. "Run" plays a short local animation so a
 * visitor can see the feedback loop the real editor gives them.
 */

type Token = { text: string; className: string };

const KEYWORDS = [
  "function", "const", "let", "return", "type", "class", "public", "static", "void",
  "import", "from", "export", "async", "await", "for", "while", "if", "else", "in",
  "def", "print", "console",
  "SELECT", "FROM", "JOIN", "WHERE", "GROUP BY", "ORDER BY", "AS", "ON", "COUNT",
  "AVG", "ROUND", "DESC", "ASC",
];

function tokenize(line: string, language: string): Token[] {
  const comment = language === "python" ? "#" : language === "sql" ? "--" : "//";
  const commentIndex = line.indexOf(comment);
  const code = commentIndex >= 0 ? line.slice(0, commentIndex) : line;
  const trailing = commentIndex >= 0 ? line.slice(commentIndex) : "";

  const pattern = /("[^"]*"|'[^']*'|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|\s+|[^\sA-Za-z0-9_$]+)/g;

  const tokens: Token[] = [];
  let match = pattern.exec(code);
  while (match) {
    const text = match[0];
    let className = "text-slate-200";
    if (/^["']/.test(text)) className = "text-emerald-300";
    else if (/^\d/.test(text)) className = "text-amber-300";
    else if (KEYWORDS.includes(text)) className = "text-violet-300";
    else if (/^[A-Za-z_$]/.test(text)) className = "text-sky-200";
    tokens.push({ text, className });
    match = pattern.exec(code);
  }
  if (trailing) tokens.push({ text: trailing, className: "italic text-slate-500" });
  return tokens;
}

function CodeLine({ line, language }: { line: string; language: string }) {
  const tokens = useMemo(() => tokenize(line, language), [line, language]);
  if (!line.trim()) return <span>&nbsp;</span>;
  return (
    <>
      {tokens.map((token, index) => (
        <span key={`${index}-${token.text}`} className={token.className}>
          {token.text}
        </span>
      ))}
    </>
  );
}

export function CodePreviewPanel({
  className,
  defaultLanguage = "javascript",
  compact = false,
}: {
  className?: string;
  defaultLanguage?: string;
  /** Shows only the first output line (used by the tighter hero variant). */
  compact?: boolean;
}) {
  const [active, setActive] = useState<string>(defaultLanguage);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");

  const demo: PlaygroundDemo =
    PLAYGROUND_DEMOS.find((item) => item.language === active) ?? PLAYGROUND_DEMOS[0]!;

  const run = () => {
    setPhase("running");
    window.setTimeout(() => setPhase("done"), 650);
  };

  const selectLanguage = (language: string) => {
    setActive(language);
    setPhase("idle");
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-pop",
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-slate-900/80 px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-rose-400/80" />
          <span className="size-2.5 rounded-full bg-amber-400/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar">
          {PLAYGROUND_DEMOS.map((item) => (
            <button
              key={item.language}
              type="button"
              onClick={() => selectLanguage(item.language)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                item.language === active
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="hidden shrink-0 font-mono text-[11px] text-slate-500 sm:block">
          {demo.file}
        </span>
      </div>

      {/* Editor */}
      <div className="max-h-[320px] overflow-auto thin-scrollbar px-2 py-3 font-mono text-[12.5px] leading-6">
        {demo.code.map((line, index) => (
          <div key={`${demo.language}-${index}`} className="grid grid-cols-[2.75rem_1fr]">
            <span className="select-none pr-3 text-right text-slate-600">{index + 1}</span>
            <span className="whitespace-pre">
              <CodeLine line={line} language={demo.language} />
            </span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 bg-slate-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <TerminalSquare className="size-3.5" />
          <span className="hidden sm:inline">Sandbox · preview of the real runner</span>
          <span className="sm:hidden">Sandbox</span>
        </div>
        <div className="flex items-center gap-2">
          {phase === "done" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-slate-300 hover:bg-white/5 hover:text-white"
              onClick={() => setPhase("idle")}
            >
              <RotateCcw />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            className="h-8"
            onClick={run}
            disabled={phase === "running"}
            loading={phase === "running"}
          >
            {phase !== "running" && <Play />}
            {phase === "running" ? "Running" : "Run code"}
          </Button>
        </div>
      </div>

      {phase === "running" && (
        <div className="flex items-center gap-2 border-t border-white/5 bg-black/40 px-4 py-3 font-mono text-[12px] text-slate-400">
          <Loader2 className="size-3.5 animate-spin" />
          Compiling and running {demo.label}…
        </div>
      )}

      {phase === "done" && (
        <div className="animate-fade-in border-t border-white/5 bg-black/40 px-4 py-3 font-mono text-[12.5px]">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-sans font-semibold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            Output · {demo.elapsed}
          </div>
          {(compact ? demo.output.slice(0, 1) : demo.output).map((line) => (
            <div key={line} className="whitespace-pre text-emerald-200/90">
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CodePreviewPanel;
