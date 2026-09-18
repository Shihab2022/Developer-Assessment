import type { PlaygroundLanguage, PlaygroundRuntime } from "./types";

/**
 * Playground language registry.
 *
 * `PROGRAMMING_LANGUAGES` in `lib/constants.ts` describes every language the
 * platform *stores* on a problem (Java, Go, SQL, …). The playground only claims
 * what it can actually run or render, so it has its own, smaller registry.
 */

export interface PlaygroundLanguageMeta {
  value: PlaygroundLanguage;
  label: string;
  /** Monaco language id. */
  monaco: string;
  /** File name shown in the editor tab strip. */
  fileName: string;
  runtime: PlaygroundRuntime;
  /** One-line description shown next to the language tabs. */
  blurb: string;
  /** Run button copy. */
  actionLabel: string;
  /** Hint shown in the console empty state. */
  emptyHint: string;
  /** Monaco tab size — Python conventions use four spaces. */
  tabSize: number;
}

export const PLAYGROUND_LANGUAGES: PlaygroundLanguageMeta[] = [
  {
    value: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    fileName: "main.js",
    runtime: "script",
    blurb: "Runs in a sandboxed Web Worker with a 6-second budget. Top-level await is supported.",
    actionLabel: "Run code",
    emptyHint: "Press Run (or Ctrl/Cmd + Enter) to execute this snippet.",
    tabSize: 2,
  },
  {
    value: "typescript",
    label: "TypeScript",
    monaco: "typescript",
    fileName: "main.ts",
    runtime: "script",
    blurb:
      "Type annotations are stripped to JavaScript before execution — no compiler round-trip required.",
    actionLabel: "Run code",
    emptyHint: "Press Run (or Ctrl/Cmd + Enter) to compile and execute this snippet.",
    tabSize: 2,
  },
  {
    value: "python",
    label: "Python",
    monaco: "python",
    fileName: "main.py",
    runtime: "python",
    blurb:
      "Executed by the Pyodide (CPython → WebAssembly) runtime. The first run downloads the runtime once, then it is reused. Names stay bound between runs, like a REPL.",
    actionLabel: "Run code",
    emptyHint: "Press Run (or Ctrl/Cmd + Enter) to execute this script.",
    tabSize: 4,
  },
  {
    value: "html",
    label: "HTML",
    monaco: "html",
    fileName: "index.html",
    runtime: "preview",
    blurb: "Rendered live in a sandboxed iframe. Console output is streamed back to this panel.",
    actionLabel: "Refresh preview",
    emptyHint: "The preview renders as you type and reloads on every Run.",
    tabSize: 2,
  },
  {
    value: "css",
    label: "CSS",
    monaco: "css",
    fileName: "styles.css",
    runtime: "preview",
    blurb:
      "Applied live to a sample page so you can see the effect of every rule immediately.",
    actionLabel: "Refresh preview",
    emptyHint: "The stylesheet is applied to the sample page on the right as you type.",
    tabSize: 2,
  },
];

export const DEFAULT_PLAYGROUND_LANGUAGE: PlaygroundLanguage = "javascript";

const LANGUAGE_MAP: Record<PlaygroundLanguage, PlaygroundLanguageMeta> = PLAYGROUND_LANGUAGES.reduce(
  (acc, language) => {
    acc[language.value] = language;
    return acc;
  },
  {} as Record<PlaygroundLanguage, PlaygroundLanguageMeta>,
);

export function playgroundLanguage(value: PlaygroundLanguage): PlaygroundLanguageMeta {
  return LANGUAGE_MAP[value];
}

/** True for HTML/CSS — the languages whose output is a rendered preview. */
export function isPreviewLanguage(value: PlaygroundLanguage): boolean {
  return LANGUAGE_MAP[value].runtime === "preview";
}