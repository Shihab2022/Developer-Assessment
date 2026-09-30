"use client";

import { useCallback, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Monaco editor for the online compiler playground.
 *
 * Deliberately thinner than the practice `CodeEditor`: the playground switches
 * between five languages and has no submit action, so the language tabs, the
 * Run button and the status text all live in the workspace toolbar.
 *
 * Monaco is loaded through `@monaco-editor/react`'s AMD loader, which is why
 * the workspace imports this file with `next/dynamic` and `ssr: false`.
 */

export interface PlaygroundEditorProps {
  value: string;
  /** Monaco language id — see `PLAYGROUND_LANGUAGES`. */
  monaco: string;
  /** Indentation width (Python uses four spaces). */
  tabSize: number;
  onChange: (value: string) => void;
  /** Bound to Ctrl/Cmd + Enter. */
  onRun?: () => void;
  readOnly?: boolean;
  className?: string;
}

export default function PlaygroundEditor({
  value,
  monaco,
  tabSize,
  onChange,
  onRun,
  readOnly = false,
  className,
}: PlaygroundEditorProps) {
  const { resolvedTheme } = useTheme();
  const runRef = useRef(onRun);

  runRef.current = onRun;

  const handleMount: OnMount = useCallback((editor, monacoApi) => {
    editor.addCommand(monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Enter, () =>
      runRef.current?.(),
    );
  }, []);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={monaco}
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
            tabSize,
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