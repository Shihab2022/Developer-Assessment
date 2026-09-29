"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Copy, Loader2, Play, RotateCcw, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SwitchField } from "@/components/ui/Checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { PlaygroundConsole } from "@/components/playground/PlaygroundConsole";
import { PreviewPane } from "@/components/playground/PreviewPane";
import {
  DEFAULT_PLAYGROUND_LANGUAGE,
  PLAYGROUND_GROUPS,
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
 * The layout follows what people expect from an online IDE: language picker and
 * Run button on top, editor on the left, and an Output / Preview / Input panel on
 * the right (stacked on narrow screens). Drafts, the active tab and the Input
 * buffer are persisted per language, so a refresh never loses work.
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
    <div className="mt-8 flex h-[calc(100vh-11rem)] min-h-[620px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:h-[calc(100vh-9.5rem)]">
      {/* Toolbar: language picker + actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Select
            value={language}
            onValueChange={(value) => handleLanguageChange(value as PlaygroundLanguage)}
          >
            <SelectTrigger className="h-9 w-[11.5rem] text-sm" aria-label="Programming language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAYGROUND_GROUPS.map((group) => (
                <SelectGroup key={group}>
                  <SelectLabel>{group}</SelectLabel>
                  {PLAYGROUND_LANGUAGES.filter((entry) => entry.group === group).map((entry) => (
                    <SelectItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          <span className="hidden items-center gap-2 sm:flex">
            <span className="font-mono text-xs text-muted-foreground">{meta.fileName}</span>
            <Badge tone={runtime.tone} size="sm">
              {runtime.label}
            </Badge>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy />
            <span className="hidden sm:inline">Copy</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw />
            Reset
          </Button>
          <Button size="sm" onClick={handleRun} loading={busy} disabled={busy}>
            {!busy && <Play />}
            {meta.actionLabel}
          </Button>
        </div>
      </div>

      <p className="border-b border-border px-4 py-2 text-xs leading-relaxed text-muted-foreground">
        {meta.blurb}
      </p>

      {/* Editor | panel */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="flex min-h-[280px] flex-col border-b border-border lg:border-b-0 lg:border-r">
          <PlaygroundEditor
            value={code}
            monaco={meta.monaco}
            fileName={meta.fileName}
            tabSize={meta.tabSize}
            onChange={handleCodeChange}
            onRun={busy ? undefined : handleRun}
            onReset={handleReset}
            className="h-full"
          />
        </div>

        <div className="flex min-h-[280px] flex-col">
          {/* Panel tabs */}
          <div className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-muted/20 px-2">
            {panes.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={pane === entry.id}
                onClick={() => setPane(entry.id)}
                className={cn(
                  "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                  pane === entry.id
                    ? "border-primary-600 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {entry.label}
              </button>
            ))}
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
                onClear={handleClear}
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
        </div>
      </div>

      {/* Footer: live-preview switch, or a note about how to run */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5">
        {preview ? (
          <SwitchField
            id="playground-auto-preview"
            checked={autoPreview}
            onCheckedChange={setAutoPreview}
            label="Live preview while typing"
            description="Turn this off to render only when you press the run button."
            className="max-w-md"
          />
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Ctrl/Cmd + Enter runs the snippet · drafts and input are saved per language
          </span>
        )}

        {runtime.tone === "amber" && (
          <span className="text-[11px] text-muted-foreground">
            {meta.label} runs on a remote sandbox — set{" "}
            <code className="font-mono">NEXT_PUBLIC_CODE_RUNNER_URL</code> to use your own runner.
          </span>
        )}
      </div>
    </div>
  );
}

export default PlaygroundWorkspace;

