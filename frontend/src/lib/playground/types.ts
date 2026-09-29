/**
 * Shared types for the online compiler playground (requirement 3).
 *
 * The playground runs user-written *programs* — not single functions like the
 * practice arena — and paints live output, so the result shape mirrors a
 * process run: an exit code, ordered console lines and a wall-clock duration.
 */

/** Every language the playground understands. */
export type PlaygroundLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "sql"
  | "go"
  | "java"
  | "html"
  | "css"
  | "tailwind"
  | "reactmui";

/** How a language produces output. */
export type PlaygroundRuntime =
  /** Executed inside the sandboxed Web Worker (JavaScript / TypeScript). */
  | "script"
  /** Executed by the Pyodide WebAssembly runtime in its own worker. */
  | "python"
  /** Executed by SQLite compiled to WebAssembly in its own worker. */
  | "sql"
  /** Dispatched to a remote, containerised sandbox (Go, Java). */
  | "remote"
  /** Rendered in a sandboxed iframe — the preview *is* the output. */
  | "preview";

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "system";

export interface ConsoleLine {
  level: ConsoleLevel;
  text: string;
}

/** A tabular result set (SQL queries). */
export interface ResultTable {
  /** Column headings, in result order. */
  columns: string[];
  rows: string[][];
}

export type RunStatus = "idle" | "running" | "success" | "error" | "timeout";

/** Outcome of a script/python/sql run or of a preview render. */
export interface RunResult {
  language: PlaygroundLanguage;
  status: Exclude<RunStatus, "idle" | "running">;
  /** Process-style exit code: 0 = success, 1 = runtime error, 124 = timeout. */
  exitCode: number;
  /** Console output in the order it was produced. */
  logs: ConsoleLine[];
  /** Set when the whole program failed (syntax error, throw, guard, timeout). */
  error?: string;
  /** Approximate `line x, column y` hint parsed from the error stack. */
  location?: string;
  durationMs: number;
  /** True when TypeScript source had to be stripped before execution. */
  transpiled: boolean;
  /** Result grids produced by a run (SQL only). */
  tables?: ResultTable[];
}
