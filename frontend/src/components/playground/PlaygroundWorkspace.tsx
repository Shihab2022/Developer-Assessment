"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Loader2, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SwitchField } from "@/components/ui/Checkbox";
import { PlaygroundConsole } from "@/components/playground/PlaygroundConsole";
import { PreviewPane } from "@/components/playground/PreviewPane";
import {
  DEFAULT_PLAYGROUND_LANGUAGE,
  PLAYGROUND_LANGUAGES,
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
 * One workspace, five languages, two execution strategies:
 *
 * - JavaScript, TypeScript and Python run in a worker and print into the
 *   console panel (`runPlaygroundCode`).
 * - HTML and CSS render into the sandboxed preview pane, and whatever the
 *   document logs is streamed back through `postMessage` into that same panel.
 *
 * Drafts, the active tab and the "live preview" switch are persisted per
 * language, so a refresh never loses work.
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

export function PlaygroundWorkspace() {
  const hydrated = usePlaygroundHydrated();
  const drafts = usePlaygroundStore((state) => state.drafts);
  const storedLanguage = usePlaygroundStore((state) => state.language);
  const autoPreview = usePlaygroundStore((state) => state.autoPreview);
  const setDraft = usePlaygroundStore((state) => state.setDraft);
  const storeLanguage = usePlaygroundStore((state) => state.setLanguage);
  const setAutoPreview = usePlaygroundStore((state) => state.setAutoPreview);

  const [language, setLanguage] = useState<PlaygroundLanguage>(DEFAULT_PLAYGROUND_LANGUAGE);
  const [code, setCode] = useState(() => snippetFor(DEFAULT_PLAYGROUND_LANGUAGE));
  const [result, setResult] = useState<RunResult | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewLogs, setPreviewLogs] = useState<ConsoleLine[]>([]);
  const [previewDoc, setPreviewDoc] = useState("");
  const [frameKey, setFrameKey] = useState(0);

  const meta = playgroundLanguage(language);
  const preview = isPreviewLanguage(language);

  /* --------------------------------------------------------- persistence */

  // Restore the saved language + draft once the store has rehydrated.
  useEffect(() => {
    if (!hydrated) return;
    const saved = storedLanguage ?? DEFAULT_PLAYGROUND_LANGUAGE;
    setLanguage(saved);
    setCode(drafts[saved] ?? snippetFor(saved));
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
      setPreviewDoc(buildPreviewDocument(language as "html" | "css", code));
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
    setPreviewDoc(buildPreviewDocument(nextLanguage as "html" | "css", nextCode));
    setFrameKey((key) => key + 1);
  }, []);

  const handleLanguageChange = useCallback(
    (next: PlaygroundLanguage) => {
      setLanguage(next);
      storeLanguage(next);
      const nextCode = drafts[next] ?? snippetFor(next);
      setCode(nextCode);
      setResult(null);
      setProgress(null);
      if (isPreviewLanguage(next)) renderPreview(next, nextCode);
    },
    [drafts, renderPreview, storeLanguage],
  );

  const handleCodeChange = useCallback(
    (next: string) => {
      setCode(next);
      setDraft(language, next);
    },
    [language, setDraft],
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

  const handleRun = useCallback(async () => {
    if (busy) return;

    if (preview) {
      renderPreview(language, code);
      return;
    }

    setBusy(true);
    setProgress(null);
    setResult(null);

    try {
      const outcome = await runPlaygroundCode({
        language,
        code,
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
  }, [busy, code, language, preview, renderPreview]);

  const consoleResult = preview ? previewResult : result;

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Toolbar: language tabs + run/reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/40 px-3 py-2.5">
        <div
          className="flex min-w-0 items-center gap-1 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Playground language"
        >
          {PLAYGROUND_LANGUAGES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              role="tab"
              aria-selected={entry.value === language}
              onClick={() => handleLanguageChange(entry.value)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                entry.value === language
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      {/* Editor | preview + output */}
      <div className="grid min-h-[560px] lg:grid-cols-2">
        <div className="flex min-h-[320px] flex-col border-b border-border lg:border-b-0 lg:border-r">
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

        <div className="flex min-h-[320px] flex-col">
          {preview && (
            <div className="flex min-h-[260px] flex-1 flex-col border-b border-border">
              <PreviewPane
                srcDoc={previewDoc}
                frameKey={frameKey}
                onRefresh={() => renderPreview(language, code)}
                className="h-full"
              />
            </div>
          )}

          <div className={cn("flex min-h-0 flex-col", preview ? "h-[240px] shrink-0" : "flex-1")}>
            <PlaygroundConsole
              result={consoleResult}
              busy={busy}
              status={progress}
              emptyHint={meta.emptyHint}
              onClear={handleClear}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {preview && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <SwitchField
            id="playground-auto-preview"
            checked={autoPreview}
            onCheckedChange={setAutoPreview}
            label="Live preview while typing"
            description="Turn this off to render only when you press the run button."
            className="max-w-md"
          />
        </div>
      )}
    </div>
  );
}

export default PlaygroundWorkspace;