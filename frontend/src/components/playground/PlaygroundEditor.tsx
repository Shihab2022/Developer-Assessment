"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type MonacoApi = Parameters<OnMount>[1];
type CompletionItem = import("monaco-editor").languages.CompletionItem;
type CompletionList = import("monaco-editor").languages.CompletionList;
type TextModel = import("monaco-editor").editor.ITextModel;
type EditorPosition = import("monaco-editor").Position;

/** Keywords worth hiding from identifier-based completions. */
const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "break",
  "continue",
  "new",
  "class",
  "extends",
  "import",
  "from",
  "export",
  "default",
  "async",
  "await",
  "try",
  "catch",
  "finally",
  "throw",
  "typeof",
  "in",
  "of",
  "this",
  "true",
  "false",
  "null",
  "undefined",
  "def",
  "print",
  "pass",
  "lambda",
  "with",
  "as",
  "is",
  "not",
  "and",
  "or",
  "elif",
  "package",
  "public",
  "static",
  "void",
  "int",
  "select",
  "where",
]);

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

  // Identifiers harvested from the current file (updated on every keystroke
  // and language switch), so completions can suggest names the user wrote
  // moments ago — e.g. a freshly declared `calculateTotal` function.
  const identifiersRef = useRef<Map<string, number>>(new Map());
  const [monacoApi, setMonacoApi] = useState<MonacoApi | null>(null);

  const refreshIdentifiers = useCallback(
    (text: string) => {
      const counts = new Map<string, number>();
      const matches = text.match(/(?<![\w$.])([A-Za-z_$][\w$]*)/g);
      for (const name of matches ?? []) {
        if (KEYWORDS.has(name)) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      identifiersRef.current = counts;
    },
    [],
  );

  useEffect(() => {
    refreshIdentifiers(value);
  }, [refreshIdentifiers, value, monaco]);

  // One completion provider per language, re-registered whenever Monaco finishes
  // loading or the user switches tabs. It reads the harvested identifiers
  // through a ref, so completions never go stale while typing.
  useEffect(() => {
    if (!monacoApi) return;

    const provider = monacoApi.languages.registerCompletionItemProvider(monaco, {
      triggerCharacters: ["."],
      provideCompletionItems(model: TextModel, position: EditorPosition): CompletionList {
        // Only complete inside this editor's model.
        if (model.getLanguageId() !== monaco) return { suggestions: [] };

        const word = model.getWordUntilPosition(position);
        const typed = word.word;
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions: CompletionItem[] = Array.from(identifiersRef.current.entries())
          .filter(([label]) =>
            label === typed
              ? false
              : typed
                ? label.toLowerCase().startsWith(typed.toLowerCase())
                : true,
          )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 25)
          .map(([label], index) => ({
            label,
            kind: monacoApi.languages.CompletionItemKind.Variable,
            insertText: label,
            range,
            sortText: String(index).padStart(2, "0"),
          }));

        return { suggestions };
      },
    });

    return () => provider.dispose();
  }, [monaco, monacoApi]);

  const handleMount: OnMount = useCallback((editor, api) => {
    editor.addCommand(api.KeyMod.CtrlCmd | api.KeyCode.Enter, () => runRef.current?.());
    setMonacoApi(api);
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
            acceptSuggestionOnEnter: "on",
            acceptSuggestionOnCommitCharacter: true,
            wordBasedSuggestions: "currentDocument",
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showWords: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
            },
            parameterHints: { enabled: true },
            hover: { enabled: "on", delay: 400 },
            tabCompletion: "on",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoSurround: "languageDefined",
            autoIndent: "full",
            formatOnType: true,
            formatOnPaste: true,
          }}
        />
      </div>
    </div>
  );
}