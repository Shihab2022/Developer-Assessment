"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Copy, Loader2, Play, RotateCcw, Terminal, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Checkbox";
import {
  PlaygroundConsole,
  PlaygroundRunStatus,
} from "@/components/playground/PlaygroundConsole";
import { PreviewPane } from "@/components/playground/PreviewPane";
import { LANGUAGE_ICON_PATHS } from "@/lib/playground/language-icons";
import {
  DEFAULT_PLAYGROUND_LANGUAGE,
  PLAYGROUND_LANGUAGES,
  acceptsStdin,
  isPreviewLanguage,
  playgroundLanguage,
} from "@/lib/playground/languages";
import { buildPreviewDocument, parsePreviewMessage } from "@/lib/playground/preview";
import { runPlaygroundCode } from "@/lib/playground/runner";
import { snippetFor } from "@/lib/playground/templates";
import type { ConsoleLine, PlaygroundLanguage, RunResult } from "@/lib/playground/types";
import { usePlaygroundHydrated, usePlaygroundStore } from "@/store/playground";
import { cn } from "@/lib/utils";

/**
 * The online compiler playground (requirement 3).
 *
 * One workspace, ten tabs, four execution strategies:
 *
 * - JavaScript and TypeScript run in a sandboxed Web Worker.
 * - Python runs on CPython compiled to WebAssembly (Pyodide).
 * - SQL runs on SQLite compiled to WebAssembly (sql.js) and paints result sets.
 * - Go and Java are dispatched to a remote, containerised sandbox.
 * - HTML, CSS, Tailwind and React + MUI render in the sandboxed preview pane,
 *   where the Tailwind compiler and Babel run inside the frame itself.
 *
 * The layout mirrors the online-compiler chrome people already know (Programiz,
 * JSFiddle): a language rail down the left, a file tab with the Run button over
 * the editor, and an Output / Preview / Input panel across a draggable divider
 * (stacked on narrow screens). Drafts, the active tab and the Input buffer are
 * persisted per language, so a refresh never loses work.
 */

/** Monaco is client-only and heavy, so it loads after the layout paints. */
const PlaygroundEditor = dynamic(() => import("@/components/playground/PlaygroundEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading editor…
    </div>
  ),
});

/** Debounce before the preview iframe is rebuilt while typing. */
const PREVIEW_DEBOUNCE_MS = 450;
/** Console lines kept per preview session. */
const MAX_PREVIEW_LOGS = 200;

/** Which panel is open on the right. */
type WorkspacePane = "output" | "preview" | "input";

/** Runtime badge copy, keyed by how a language produces output. */
const RUNTIME_LABELS: Record<
  PlaygroundLanguage,
  { label: string; tone: "blue" | "violet" | "amber" | "green" }
> = {
  javascript: { label: "Web Worker", tone: "blue" },
  typescript: { label: "Web Worker", tone: "blue" },
  python: { label: "Python / Wasm", tone: "blue" },
  sql: { label: "SQLite / Wasm", tone: "green" },
  go: { label: "Remote sandbox", tone: "amber" },
  java: { label: "Remote sandbox", tone: "amber" },
  html: { label: "Live preview", tone: "violet" },
  css: { label: "Live preview", tone: "violet" },
  tailwind: { label: "Tailwind JIT", tone: "violet" },
  reactmui: { label: "React + MUI", tone: "violet" },
};

/** One-line "how do I read input" note per runtime. */
const STDIN_NOTES: Partial<Record<PlaygroundLanguage, string>> = {
  javascript:
    'The snippet reads this buffer with `readLine()` (null at the end) or `input("prompt")`.',
  typescript:
    'The snippet reads this buffer with `readLine()` (null at the end) or `input("prompt")`.',
  python: "Python sees this buffer as `sys.stdin`, so `input()` and `for line in sys.stdin` both work.",
  go: "Go receives this buffer on standard input — read it with `bufio.Scanner` or `fmt.Scan`.",
  java: "Java receives this buffer on standard input — read it with a `Scanner(System.in)`.",
};


export function PlaygroundWorkspace() {
  const hydrated = usePlaygroundHydrated();
  const drafts = usePlaygroundStore((state) => state.drafts);
  const storedStdin = usePlaygroundStore((state) => state.stdin);
  const storedLanguage = usePlaygroundStore((state) => state.language);
  const autoPreview = usePlaygroundStore((state) => state.autoPreview);
  const setDraft = usePlaygroundStore((state) => state.setDraft);
  const storeStdin = usePlaygroundStore((state) => state.setStdin);
  const storeLanguage = usePlaygroundStore((state) => state.setLanguage);
  const setAutoPreview = usePlaygroundStore((state) => state.setAutoPreview);

  const [language, setLanguage] = useState<PlaygroundLanguage>(DEFAULT_PLAYGROUND_LANGUAGE);
  const [code, setCode] = useState(() => snippetFor(DEFAULT_PLAYGROUND_LANGUAGE));
  const [stdinValue, setStdinValue] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pane, setPane] = useState<WorkspacePane>("output");
  const [previewLogs, setPreviewLogs] = useState<ConsoleLine[]>([]);
  const [previewDoc, setPreviewDoc] = useState("");
  const [frameKey, setFrameKey] = useState(0);
  /** Editor pane width as a percentage of the split row (desktop only). */
  const [split, setSplit] = useState(50);
  /** True while the divider is being dragged. */
  const [dragging, setDragging] = useState(false);
  /** True at the `lg` breakpoint, where the two panes sit side by side. */
  const [isWide, setIsWide] = useState(false);
  const splitAreaRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);

  // The divider only exists from `lg` up, so mirror Tailwind's breakpoint.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const meta = playgroundLanguage(language);
  const preview = isPreviewLanguage(language);
  const runtime = RUNTIME_LABELS[language];
  const stdinAvailable = acceptsStdin(language);

  /* --------------------------------------------------------- persistence */

  // Restore the saved language + draft once the store has rehydrated.
  useEffect(() => {
    if (!hydrated) return;
    const saved = storedLanguage ?? DEFAULT_PLAYGROUND_LANGUAGE;
    setLanguage(saved);
    setCode(drafts[saved] ?? snippetFor(saved));
    setStdinValue(storedStdin?.[saved] ?? "");
    setPane(isPreviewLanguage(saved) ? "preview" : "output");
    setResult(null);
    setProgress(null);
    // Intentionally keyed on hydration only: later edits already land in the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  /* ------------------------------------------------------- preview wiring */

  // Rebuild the preview document while typing (debounced) when live preview is on.
  useEffect(() => {
    if (!preview || !autoPreview) return;
    const timer = window.setTimeout(() => {
      setPreviewDoc(buildPreviewDocument(language, code));
    }, PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [preview, autoPreview, language, code]);

  // Collect console output + runtime errors streamed by the preview bridge.
  useEffect(() => {
    if (!preview) return;
    const onMessage = (event: MessageEvent) => {
      const line = parsePreviewMessage(event.data);
      if (!line) return;
      setPreviewLogs((current) => [...current, line].slice(-MAX_PREVIEW_LOGS));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [preview]);

  // Preview output is wrapped in the same result shape the runner returns.
  const previewResult = useMemo<RunResult | null>(() => {
    if (!preview) return null;
    const failed = previewLogs.some((line) => line.level === "error");
    return {
      language,
      status: failed ? "error" : "success",
      exitCode: failed ? 1 : 0,
      logs: previewLogs,
      durationMs: 0,
      transpiled: false,
    };
  }, [preview, language, previewLogs]);

  /* -------------------------------------------------------------- actions */

  /** Rebuilds the preview iframe and clears its console. */
  const renderPreview = useCallback((nextLanguage: PlaygroundLanguage, nextCode: string) => {
    setPreviewLogs([]);
    setPreviewDoc(buildPreviewDocument(nextLanguage, nextCode));
    setFrameKey((key) => key + 1);
  }, []);

  const handleLanguageChange = useCallback(
    (next: PlaygroundLanguage) => {
      setLanguage(next);
      storeLanguage(next);
      const nextCode = drafts[next] ?? snippetFor(next);
      setCode(nextCode);
      setStdinValue(storedStdin?.[next] ?? "");
      setResult(null);
      setProgress(null);
      setPane(isPreviewLanguage(next) ? "preview" : "output");
      if (isPreviewLanguage(next)) renderPreview(next, nextCode);
    },
    [drafts, renderPreview, storeLanguage, storedStdin],
  );

  const handleCodeChange = useCallback(
    (next: string) => {
      setCode(next);
      setDraft(language, next);
    },
    [language, setDraft],
  );

  const handleStdinChange = useCallback(
    (next: string) => {
      setStdinValue(next);
      storeStdin(language, next);
    },
    [language, storeStdin],
  );

  const handleReset = useCallback(() => {
    const starter = snippetFor(language);
    setCode(starter);
    setDraft(language, starter);
    setResult(null);
    setProgress(null);
    if (preview) renderPreview(language, starter);
  }, [language, preview, renderPreview, setDraft]);

  const handleClear = useCallback(() => {
    setResult(null);
    setPreviewLogs([]);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Snippet copied to the clipboard");
    } catch {
      toast.error("This browser blocked clipboard access");
    }
  }, [code]);

  const handleRun = useCallback(async () => {
    if (busy) return;

    if (preview) {
      renderPreview(language, code);
      setPane("preview");
      return;
    }

    setBusy(true);
    setProgress(null);
    setResult(null);
    setPane("output");

    try {
      const outcome = await runPlaygroundCode({
        language,
        code,
        stdin: stdinValue,
        fileName: meta.fileName,
        onStatus: (message) => setProgress(message),
      });
      setResult(outcome);

      if (outcome.status === "timeout") {
        toast.warning(outcome.error ?? "Time limit exceeded.");
      } else if (outcome.status === "error" && outcome.error) {
        toast.error(outcome.error);
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }, [busy, code, language, meta.fileName, preview, renderPreview, stdinValue]);

  const consoleResult = preview ? previewResult : result;

  const panes = useMemo(() => {
    const entries: { id: WorkspacePane; label: string }[] = [];
    if (preview) entries.push({ id: "preview", label: "Preview" });
    entries.push({ id: "output", label: "Output" });
    if (stdinAvailable) entries.push({ id: "input", label: "Input (stdin)" });
    return entries;
  }, [preview, stdinAvailable]);

  return (
    <div className="flex min-h-[560px] flex-1 flex-col overflow-hidden border-t border-border bg-card">
      {/* Title bar: the "<language> Online Compiler" header */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/30 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-600 text-white">
            <Terminal className="size-4" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {meta.label} Online Compiler
            </h1>
            <p
              className="hidden truncate text-xs text-muted-foreground md:block"
              title={meta.blurb}
            >
              {meta.blurb}
            </p>
          </div>
        </div>

        <Badge tone={runtime.tone} size="sm">
          {runtime.label}
        </Badge>
      </div>

      {/* Language rail + editor/output split */}
      <div ref={splitAreaRef} className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav
          ref={railRef}
          aria-label="Playground languages"
          className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/20 p-1.5 lg:w-14 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-2"
        >
          {PLAYGROUND_LANGUAGES.map((entry) => {
            const active = entry.value === language;
            return (
              <button
                key={entry.value}
                type="button"
                onClick={() => handleLanguageChange(entry.value)}
                title={entry.label}
                aria-label={entry.label}
                aria-pressed={active}
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-lg text-[11px] font-bold uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  active
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-border hover:text-foreground",
                )}
              >
                {/* Brand glyph on the vertical rail, short label in the mobile strip. */}
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="hidden size-5 lg:block"
                  fill="currentColor"
                >
                  <path d={LANGUAGE_ICON_PATHS[entry.value]} />
                </svg>
                <span className="lg:hidden">{entry.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Editor pane: file tab strip with Copy / Reset / Run, like an IDE */}
        <section
          className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border lg:flex-none lg:border-b-0"
          style={isWide ? { width: `${split}%` } : undefined}
        >
          <div className="flex h-11 shrink-0 items-stretch justify-between gap-2 border-b border-border bg-muted/40 px-2">
            <div className="flex min-w-0 items-stretch">
              <span className="flex items-center border-b-2 border-primary-600 px-2 font-mono text-xs font-medium text-foreground">
                {meta.fileName}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="iconSm"
                onClick={handleCopy}
                title="Copy code"
                aria-label="Copy code"
              >
                <Copy />
              </Button>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={handleReset}
                title="Restore the starter snippet"
                aria-label="Restore the starter snippet"
              >
                <RotateCcw />
              </Button>
              <Button size="sm" onClick={handleRun} loading={busy} disabled={busy}>
                {!busy && <Play />}
                {meta.actionLabel}
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <PlaygroundEditor
              value={code}
              monaco={meta.monaco}
              tabSize={meta.tabSize}
              onChange={handleCodeChange}
              onRun={busy ? undefined : handleRun}
              className="h-full"
            />
          </div>
        </section>

        {/* Draggable divider between the editor and the output pane */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the editor and output panes"
          aria-valuenow={Math.round(split)}
          aria-valuemin={25}
          aria-valuemax={75}
          title="Drag to resize · double-click to reset"
          style={{ touchAction: "none" }}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            if (!dragging || !isWide) return;
            const rect = splitAreaRef.current?.getBoundingClientRect();
            const rail = railRef.current?.getBoundingClientRect();
            if (!rect || !rail || rect.width <= 0) return;
            const next = ((event.clientX - rect.left - rail.width) / rect.width) * 100;
            setSplit(Math.min(75, Math.max(25, next)));
          }}
          onPointerUp={(event) => {
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(false);
          }}
          onPointerCancel={() => setDragging(false)}
          onDoubleClick={() => setSplit(50)}
          className={cn(
            "hidden w-2 shrink-0 cursor-col-resize select-none items-center justify-center border-r border-border transition-colors lg:flex",
            dragging
              ? "bg-primary-100 dark:bg-primary-950/60"
              : "bg-muted/40 hover:bg-primary-100/60 dark:hover:bg-primary-950/40",
          )}
        >
          <span className="h-10 w-0.5 rounded-full bg-border" aria-hidden="true" />
        </div>

        {/* Output / preview / input pane */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-[2.75rem] shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border bg-muted/40 px-2 py-1">
            <div
              role="tablist"
              aria-label="Output panels"
              className="no-scrollbar flex items-center gap-1 overflow-x-auto"
            >
              {panes.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={pane === entry.id}
                  onClick={() => setPane(entry.id)}
                  className={cn(
                    "flex h-9 items-center whitespace-nowrap border-b-2 px-3 text-xs font-semibold uppercase tracking-wide transition-colors",
                    pane === entry.id
                      ? "border-primary-600 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <PlaygroundRunStatus
              result={consoleResult}
              busy={busy}
              status={progress}
              onClear={handleClear}
            />
          </div>

          <div className="min-h-0 flex-1">
            {pane === "preview" && preview && (
              <PreviewPane
                srcDoc={previewDoc}
                frameKey={frameKey}
                onRefresh={() => renderPreview(language, code)}
                className="h-full"
              />
            )}

            {pane === "output" && (
              <PlaygroundConsole
                result={consoleResult}
                busy={busy}
                status={progress}
                emptyHint={meta.emptyHint}
                className="h-full"
              />
            )}

            {pane === "input" && stdinAvailable && (
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
                  <TerminalSquare className="size-3.5 shrink-0" />
                  <span>
                    {STDIN_NOTES[language] ?? "The program reads this buffer on standard input."}
                  </span>
                </div>
                <textarea
                  value={stdinValue}
                  onChange={(event) => handleStdinChange(event.target.value)}
                  spellCheck={false}
                  placeholder={"10 20 30\nDhaka"}
                  aria-label="Program input (stdin)"
                  className="thin-scrollbar min-h-0 flex-1 resize-none border-0 bg-slate-950 p-4 font-mono text-[12.5px] leading-relaxed text-emerald-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Status bar: shortcuts, live-preview switch, sandbox notes */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="truncate">
          Ctrl/Cmd + Enter runs the snippet · drafts and input are saved per language
          {isWide ? " · drag the divider to resize the panes" : ""}
        </span>

        <div className="flex items-center gap-3">
          {preview ? (
            <label
              htmlFor="playground-auto-preview"
              className="flex cursor-pointer items-center gap-2 whitespace-nowrap"
            >
              <span>Live preview while typing</span>
              <Switch
                id="playground-auto-preview"
                checked={autoPreview}
                onCheckedChange={setAutoPreview}
              />
            </label>
          ) : runtime.tone === "amber" ? (
            <span className="truncate">
              {meta.label} runs on a remote sandbox — set{" "}
              <code className="font-mono">NEXT_PUBLIC_CODE_RUNNER_URL</code> to use your own runner.
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PlaygroundWorkspace;

