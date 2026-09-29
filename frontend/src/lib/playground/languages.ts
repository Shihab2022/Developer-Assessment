import type { PlaygroundLanguage, PlaygroundRuntime } from "./types";

/**
 * Playground language registry.
 *
 * `PROGRAMMING_LANGUAGES` in `lib/constants.ts` describes every language the
 * platform *stores* on a problem (Java, Go, SQL, …). The playground only claims
 * what it can actually run or render, so it has its own, smaller registry — ten
 * tabs grouped for the picker: scripting, systems, data and web.
 */

export interface PlaygroundLanguageMeta {
  value: PlaygroundLanguage;
  label: string;
  /** Short label used in tight spots (mobile toolbar, badges). */
  shortLabel: string;
  /** Monaco language id. */
  monaco: string;
  /** File name shown in the editor tab strip. */
  fileName: string;
  runtime: PlaygroundRuntime;
  /** Picker group heading. */
  group: "Scripting" | "Systems" | "Data" | "Web";
  /** One-line description shown under the toolbar. */
  blurb: string;
  /** Run button copy. */
  actionLabel: string;
  /** Hint shown in the console empty state. */
  emptyHint: string;
  /** Monaco tab size — Python conventions use four spaces. */
  tabSize: number;
  /** Runtime identifier used by the remote sandbox (`go`, `java`). */
  remoteId?: string;
}

export const PLAYGROUND_LANGUAGES: PlaygroundLanguageMeta[] = [
  {
    value: "javascript",
    label: "JavaScript",
    shortLabel: "JS",
    monaco: "javascript",
    fileName: "main.js",
    runtime: "script",
    group: "Scripting",
    blurb: "Runs in a sandboxed Web Worker with a 6-second budget. Top-level await is supported.",
    actionLabel: "Run code",
    emptyHint: "Press Run (or Ctrl/Cmd + Enter) to execute this snippet.",
    tabSize: 2,
  },
  {
    value: "typescript",
    label: "TypeScript",
    shortLabel: "TS",
    monaco: "typescript",
    fileName: "main.ts",
    runtime: "script",
    group: "Scripting",
    blurb:
      "Type annotations are stripped to JavaScript before execution — no compiler round-trip required.",
    actionLabel: "Run code",
    emptyHint: "Press Run (or Ctrl/Cmd + Enter) to compile and execute this snippet.",
    tabSize: 2,
  },
  {
    value: "python",
    label: "Python",
    shortLabel: "Py",
    monaco: "python",
    fileName: "main.py",
    runtime: "python",
    group: "Scripting",
    blurb:
      "Executed by the Pyodide (CPython → WebAssembly) runtime, downloaded once per session. Names stay bound between runs, like a REPL.",
    actionLabel: "Run code",
    emptyHint: "Press Run (or Ctrl/Cmd + Enter) to execute this script.",
    tabSize: 4,
  },
  {
    value: "go",
    label: "Go",
    shortLabel: "Go",
    monaco: "go",
    fileName: "main.go",
    runtime: "remote",
    group: "Systems",
    blurb:
      "Compiled and run on a sandboxed Go toolchain, so `go run`, `fmt.Println` output and compiler errors behave exactly as they do locally.",
    actionLabel: "Run code",
    emptyHint: "Press Run to send this program to the sandbox and collect its output.",
    tabSize: 2,
    remoteId: "go",
  },
  {
    value: "java",
    label: "Java",
    shortLabel: "Jv",
    monaco: "java",
    fileName: "Main.java",
    runtime: "remote",
    group: "Systems",
    blurb:
      "Compiled with `javac` and executed in a sandbox, so class output, stack traces and exit codes behave exactly as they do locally.",
    actionLabel: "Run code",
    emptyHint: "Press Run to compile and execute this class in the sandbox.",
    tabSize: 4,
    remoteId: "java",
  },
  {
    value: "sql",
    label: "SQL",
    shortLabel: "SQL",
    monaco: "sql",
    fileName: "query.sql",
    runtime: "sql",
    group: "Data",
    blurb:
      "Real SQLite compiled to WebAssembly, seeded with an `employees` / `departments` schema. Statements run in order and result sets render as a table.",
    actionLabel: "Run query",
    emptyHint: "Write a SELECT (or any DML) and press Run — results appear as a table.",
    tabSize: 2,
  },
  {
    value: "html",
    label: "HTML",
    shortLabel: "HTML",
    monaco: "html",
    fileName: "index.html",
    runtime: "preview",
    group: "Web",
    blurb: "Rendered live in a sandboxed iframe; console output streams back to the output panel.",
    actionLabel: "Refresh preview",
    emptyHint: "The preview renders as you type and reloads on every Run.",
    tabSize: 2,
  },
  {
    value: "css",
    label: "CSS",
    shortLabel: "CSS",
    monaco: "css",
    fileName: "styles.css",
    runtime: "preview",
    group: "Web",
    blurb: "Applied live to a sample page so you can see the effect of every rule immediately.",
    actionLabel: "Refresh preview",
    emptyHint: "The stylesheet is applied to the sample page on the right as you type.",
    tabSize: 2,
  },
  {
    value: "tailwind",
    label: "Tailwind CSS",
    shortLabel: "TW",
    monaco: "html",
    fileName: "index.html",
    runtime: "preview",
    group: "Web",
    blurb:
      "The Tailwind compiler runs inside the preview: utility classes compile as you type, and an editable `tailwind.config` block themes the tokens.",
    actionLabel: "Compile & preview",
    emptyHint: "Write markup with utility classes — the Tailwind build runs in the preview pane.",
    tabSize: 2,
  },
  {
    value: "reactmui",
    label: "React + MUI",
    shortLabel: "MUI",
    monaco: "javascript",
    fileName: "App.jsx",
    runtime: "preview",
    group: "Web",
    blurb:
      "React, Material UI and Babel run inside the preview, so JSX in this tab compiles and mounts a live component tree.",
    actionLabel: "Render app",
    emptyHint: "Edit the component and press Run — the mounted UI appears in the preview.",
    tabSize: 2,
  },
];

export const DEFAULT_PLAYGROUND_LANGUAGE: PlaygroundLanguage = "javascript";

/** Language groups, in the order the picker shows them. */
export const PLAYGROUND_GROUPS: PlaygroundLanguageMeta["group"][] = [
  "Scripting",
  "Systems",
  "Data",
  "Web",
];

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

/** True for HTML/CSS/Tailwind/React — the languages whose output is a rendered preview. */
export function isPreviewLanguage(value: PlaygroundLanguage): boolean {
  return LANGUAGE_MAP[value].runtime === "preview";
}

/** True for languages that read a `stdin` buffer from the Input tab. */
export function acceptsStdin(value: PlaygroundLanguage): boolean {
  return ["script", "python", "remote"].includes(LANGUAGE_MAP[value].runtime);
}

