"use client";

import { useCallback, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Monaco-backed code editor for the practice arena.
 *
 * Monaco itself is fetched by `@monaco-editor/react`'s AMD loader, so this
 * component is imported through `next/dynamic` with `ssr: false`: the editor
 * never blocks the first paint and is only downloaded when a solver page opens.
 */

export interface CodeEditorProps {
  value: string;
  language: "javascript" | "typescript";
  onChange: (value: string) => void;
  onReset: () => void;
  onRun?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  className?: string;
}

export default function CodeEditor({
  value,
  language,
  onChange,
  onReset,
  onRun,
  onSubmit,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const runRef = useRef(onRun);
  const submitRef = useRef(onSubmit);

  runRef.current = onRun;
  submitRef.current = onSubmit;

  const handleMount: OnMount = useCallback((editor, monaco) => {
    // Ctrl/Cmd+Enter runs, Ctrl/Cmd+S submits (the platform's usual shortcuts).
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current?.());
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => submitRef.current?.());
  }, []);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <span className="font-mono text-xs font-medium text-muted-foreground">
          {language === "typescript" ? "solution.ts" : "solution.js"}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            /Ctrl + Enter to run
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={readOnly}
            title="Restore the starter code"
          >
            <RotateCcw />
            Reset
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(next) => onChange(next ?? "")}
          onMount={handleMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          loading={
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading editor…
            </div>
          }
          options={{
            readOnly,
            fontSize: 13,
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            tabSize: 2,
            automaticLayout: true,
            renderLineHighlight: "line",
            padding: { top: 12, bottom: 12 },
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            wordWrap: "on",
            quickSuggestions: { other: true, comments: false, strings: false },
            suggestOnTriggerCharacters: true,
            fixedOverflowWidgets: true,
          }}
        />
      </div>
    </div>
  );
}