"use client";

import type { PlaygroundRunRequest, PlaygroundRunResponse } from "@/workers/playground.worker";
import {
  PYTHON_LOAD_TIMEOUT_MS,
  PYTHON_RUN_TIMEOUT_MS,
  PYTHON_WORKER_URL,
  REMOTE_RUNNER_URL,
  REMOTE_TIMEOUT_MS,
  SCRIPT_TIMEOUT_MS,
  SQL_LOAD_TIMEOUT_MS,
  SQL_RUN_TIMEOUT_MS,
  SQL_WORKER_URL,
} from "./limits";
import type { ConsoleLine, PlaygroundLanguage, ResultTable, RunResult } from "./types";

/**
 * Main-thread bridge to the playground sandboxes (requirement 3).
 *
 * Four runtimes live behind this module:
 *
 * - **JavaScript / TypeScript** run in a *bundled* Web Worker created per run,
 *   so a snippet stuck in an infinite loop can always be terminated.
 * - **Python** is delegated to the Pyodide WebAssembly runtime running in a
 *   plain worker served from `public/playground/`. That worker is created once
 *   and kept warm, because booting CPython costs a ~10 MB download.
 * - **SQL** is delegated to SQLite compiled to WebAssembly (sql.js), again in a
 *   long-lived worker seeded with a demo schema.
 * - **Go and Java** are dispatched to a remote, containerised sandbox
 *   (`REMOTE_RUNNER_URL`, Piston protocol). Nothing else can execute them from a
 *   browser tab, and the UI says so.
 *
 * HTML, CSS, Tailwind and React + MUI never reach this module — they render in
 * the preview pane.
 */

/** Shape of the messages posted by `public/playground/python-worker.js`. */
interface PythonWorkerMessage {
  id: number;
  type: "status" | "ready" | "done";
  message?: string;
  ok?: boolean;
  logs?: ConsoleLine[];
  error?: string;
  durationMs?: number;
}

/** True once the Pyodide runtime has finished loading in this tab. */
let pythonReady = false;
let pythonBusy = false;
let pythonWorker: Worker | null = null;

function errorResult(language: PlaygroundLanguage, message: string, durationMs = 0): RunResult {
  return {
    language,
    status: "error",
    exitCode: 1,
    logs: [{ level: "error", text: message }],
    error: message,
    durationMs,
    transpiled: false,
  };
}

function timeoutResult(
  language: PlaygroundLanguage,
  seconds: number,
  logs: ConsoleLine[],
  durationMs: number,
): RunResult {
  const message = `Time limit exceeded (${seconds}s). Check for an infinite loop.`;
  return {
    language,
    status: "timeout",
    exitCode: 124,
    logs: [...logs, { level: "error", text: message }],
    error: message,
    durationMs,
    transpiled: false,
  };
}

/* ------------------------------------------------- JavaScript / TypeScript */

export async function runScript(options: {
  code: string;
  language: "javascript" | "typescript";
  /** Text from the Input tab, exposed to the code as `readLine()` / `input()`. */
  stdin?: string;
}): Promise<RunResult> {
  const { code, language, stdin } = options;

  if (!code.trim()) return errorResult(language, "Write some code before running it.");

  let worker: Worker;
  try {
    worker = new Worker(new URL("../../workers/playground.worker.ts", import.meta.url));
  } catch {
    return errorResult(language, "This browser could not start the playground sandbox worker.");
  }

  const requestId = Date.now();
  const startedAt = performance.now();

  return new Promise<RunResult>((resolve) => {
    let settled = false;

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      finish(
        timeoutResult(language, SCRIPT_TIMEOUT_MS / 1000, [], performance.now() - startedAt),
      );
    }, SCRIPT_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<PlaygroundRunResponse>) => {
      const response = event.data;
      if (!response || response.id !== requestId) return;

      finish({
        language,
        status: response.ok ? "success" : "error",
        exitCode: response.ok ? 0 : 1,
        logs: response.logs ?? [],
        error: response.error,
        location: response.location,
        durationMs: response.durationMs,
        transpiled: response.transpiled,
      });
    };

    worker.onerror = (event) => {
      finish(
        errorResult(
          language,
          event.message || "The sandbox worker crashed while running your code.",
          performance.now() - startedAt,
        ),
      );
    };

    const request: PlaygroundRunRequest = { id: requestId, code, language, stdin };
    worker.postMessage(request);
  });
}

/* --------------------------------------------------------------- Python */

/** Reports whether the Python runtime is loaded (used for UI copy). */
export function isPythonRuntimeReady(): boolean {
  return pythonReady;
}

/**
 * Python prelude that feeds the Input tab's text to `input()` and `sys.stdin`.
 *
 * Prepending real Python (rather than depending on Pyodide's stdin hooks) keeps
 * `input()`, `sys.stdin.readline()` and `for line in sys.stdin` all working, and
 * it makes the prompt text show up in the output panel exactly like a terminal.
 */
function pythonStdinPrelude(stdin: string): string {
  const literal = JSON.stringify(stdin);
  return `# ------------------------------------------------- Input tab (stdin) ---
import builtins as __devassess_builtins
import io as __devassess_io
import sys as __devassess_sys

__devassess_sys.stdin = __devassess_io.StringIO(${literal})
__devassess_lines = iter(__devassess_sys.stdin.readlines())


def __devassess_input(prompt=""):
    if prompt:
        print(prompt, end="")
    try:
        return next(__devassess_lines).rstrip("\\n")
    except StopIteration:
        raise EOFError("EOF when reading a line")


__devassess_builtins.input = __devassess_input`;
}

function createPythonWorker(): Worker | null {
  if (typeof Worker === "undefined") return null;
  try {
    return new Worker(PYTHON_WORKER_URL);
  } catch {
    return null;
  }
}

export async function runPython(options: {
  code: string;
  /** Text from the Input tab, wired to `input()` and `sys.stdin`. */
  stdin?: string;
  /** Receives runtime progress such as "Downloading the Python runtime…". */
  onStatus?: (message: string) => void;
}): Promise<RunResult> {
  const { code, stdin, onStatus } = options;
  const program = stdin ? `${pythonStdinPrelude(stdin)}\n${code}` : code;

  if (!code.trim()) return errorResult("python", "Write some code before running it.");
  if (pythonBusy) {
    return errorResult("python", "A Python run is still in progress. Try again in a moment.");
  }

  const worker = pythonWorker ?? createPythonWorker();
  if (!worker) {
    return errorResult("python", "This browser blocked the worker the Python runtime needs.");
  }
  pythonWorker = worker;

  pythonBusy = true;
  const requestId = Date.now();
  const startedAt = performance.now();
  const statusLogs: ConsoleLine[] = [];

  try {
    return await new Promise<RunResult>((resolve) => {
      let settled = false;

      const timeoutMs = pythonReady ? PYTHON_RUN_TIMEOUT_MS : PYTHON_LOAD_TIMEOUT_MS;

      const finish = (result: RunResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.onmessage = null;
        worker.onerror = null;
        resolve(result);
      };

      const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
        // A Python run cannot be interrupted safely, so the worker is dropped
        // and recreated (cold runtime) on the next attempt.
        worker.terminate();
        pythonWorker = null;
        pythonReady = false;
        finish(
          timeoutResult("python", timeoutMs / 1000, statusLogs, performance.now() - startedAt),
        );
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent<PythonWorkerMessage>) => {
        const message = event.data;
        if (!message || message.id !== requestId) return;

        if (message.type === "status") {
          if (message.message) {
            statusLogs.push({ level: "system", text: message.message });
            onStatus?.(message.message);
          }
          return;
        }

        if (message.type === "ready") {
          pythonReady = true;
          return;
        }

        if (message.type !== "done") return;

        finish({
          language: "python",
          status: message.ok ? "success" : "error",
          exitCode: message.ok ? 0 : 1,
          logs: message.logs ?? [],
          error: message.error,
          durationMs: message.durationMs ?? performance.now() - startedAt,
          transpiled: false,
        });
      };

      worker.onerror = (event) => {
        pythonWorker = null;
        pythonReady = false;
        finish(
          errorResult(
            "python",
            event.message || "The Python runtime crashed while running your code.",
            performance.now() - startedAt,
          ),
        );
      };

      worker.postMessage({ id: requestId, code: program });
    });
  } finally {
    pythonBusy = false;
  }
}

/* -------------------------------------------------------------------- SQL */

/** Shape of the messages posted by `public/playground/sql-worker.js`. */
interface SqlWorkerMessage {
  id: number;
  type: "status" | "ready" | "done";
  message?: string;
  ok?: boolean;
  logs?: ConsoleLine[];
  tables?: ResultTable[];
  error?: string;
  durationMs?: number;
}

let sqlReady = false;
let sqlBusy = false;
let sqlWorker: Worker | null = null;

function createSqlWorker(): Worker | null {
  if (typeof Worker === "undefined") return null;
  try {
    return new Worker(SQL_WORKER_URL);
  } catch {
    return null;
  }
}

/**
 * Runs SQL against an in-browser SQLite database.
 *
 * The worker stays warm (like the Python one) because the first run downloads
 * the ~1.5 MB WebAssembly runtime, and the database itself persists between
 * runs — a table created in one query is visible to the next.
 */
export async function runSql(options: {
  code: string;
  onStatus?: (message: string) => void;
}): Promise<RunResult> {
  const { code, onStatus } = options;

  if (!code.trim()) return errorResult("sql", "Write a query before running it.");
  if (sqlBusy) return errorResult("sql", "A query is still running. Try again in a moment.");

  const worker = sqlWorker ?? createSqlWorker();
  if (!worker) {
    return errorResult("sql", "This browser blocked the worker the SQLite runtime needs.");
  }
  sqlWorker = worker;

  sqlBusy = true;
  const requestId = Date.now();
  const startedAt = performance.now();

  try {
    return await new Promise<RunResult>((resolve) => {
      let settled = false;

      const timeoutMs = sqlReady ? SQL_RUN_TIMEOUT_MS : SQL_LOAD_TIMEOUT_MS;

      const finish = (result: RunResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.onmessage = null;
        worker.onerror = null;
        resolve(result);
      };

      const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
        worker.terminate();
        sqlWorker = null;
        sqlReady = false;
        finish(timeoutResult("sql", timeoutMs / 1000, [], performance.now() - startedAt));
      }, timeoutMs);

      worker.onmessage = (event: MessageEvent<SqlWorkerMessage>) => {
        const message = event.data;
        if (!message || message.id !== requestId) return;

        if (message.type === "status") {
          if (message.message) onStatus?.(message.message);
          return;
        }

        if (message.type === "ready") {
          sqlReady = true;
          return;
        }

        if (message.type !== "done") return;

        finish({
          language: "sql",
          status: message.ok ? "success" : "error",
          exitCode: message.ok ? 0 : 1,
          logs: message.logs ?? [],
          tables: message.tables ?? [],
          error: message.error,
          durationMs: message.durationMs ?? performance.now() - startedAt,
          transpiled: false,
        });
      };

      worker.onerror = (event) => {
        sqlWorker = null;
        sqlReady = false;
        finish(
          errorResult(
            "sql",
            event.message || "The SQLite runtime crashed while running your query.",
            performance.now() - startedAt,
          ),
        );
      };

      worker.postMessage({ id: requestId, code });
    });
  } finally {
    sqlBusy = false;
  }
}

/* ------------------------------------------------------------------ remote */

/** Piston v2 response shape (the subset the playground reads). */
interface PistonResponse {
  language?: string;
  version?: string;
  compile?: { stdout?: string; stderr?: string; code?: number | null; output?: string };
  run?: { stdout?: string; stderr?: string; code?: number | null; output?: string };
  message?: string;
}

/** Splits captured process output into console lines. */
function toLines(text: string | undefined, level: ConsoleLine["level"]): ConsoleLine[] {
  if (!text) return [];
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/, "")
    .split("\n")
    .map((line) => ({ level, text: line }));
}

/**
 * Runs Go or Java on a remote, containerised sandbox.
 *
 * A browser tab cannot execute these languages, so the snippet is posted to a
 * Piston-compatible endpoint (`REMOTE_RUNNER_URL`) together with the Input tab's
 * stdin. Compiler output is surfaced as well, which is where Go and Java users
 * spend most of their time.
 */
export async function runRemote(options: {
  language: "go" | "java";
  code: string;
  stdin?: string;
  fileName: string;
  onStatus?: (message: string) => void;
}): Promise<RunResult> {
  const { language, code, stdin, fileName, onStatus } = options;

  if (!code.trim()) return errorResult(language, "Write some code before running it.");

  onStatus?.("Sending the program to the sandbox…");
  const startedAt = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS);

  try {
    const response = await fetch(REMOTE_RUNNER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        language,
        // The hosted sandbox tracks upstream releases, so `*` selects whichever
        // toolchain version the instance has installed.
        version: "*",
        files: [{ name: fileName, content: code }],
        stdin: stdin ?? "",
        compile_timeout: 10_000,
        run_timeout: 5_000,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return errorResult(
        language,
        `The remote sandbox answered ${response.status}. ${detail.slice(0, 200)}`.trim(),
        performance.now() - startedAt,
      );
    }

    const payload = (await response.json()) as PistonResponse;
    const logs: ConsoleLine[] = [
      ...toLines(payload.compile?.stdout, "log"),
      ...toLines(payload.compile?.stderr, "warn"),
      ...toLines(payload.run?.stdout, "log"),
      ...toLines(payload.run?.stderr, "error"),
    ];

    if (payload.message) logs.unshift({ level: "error", text: payload.message });

    const compileFailed = typeof payload.compile?.code === "number" && payload.compile.code !== 0;
    const runCode = payload.run?.code ?? (compileFailed ? payload.compile?.code : 0);
    const ok = !compileFailed && (runCode === 0 || runCode === null);

    return {
      language,
      status: ok ? "success" : "error",
      exitCode: typeof runCode === "number" ? runCode : ok ? 0 : 1,
      logs,
      error: ok ? undefined : compileFailed ? "The compiler rejected the program." : undefined,
      durationMs: performance.now() - startedAt,
      transpiled: false,
    };
  } catch (error) {
    const aborted = (error as Error).name === "AbortError";
    return errorResult(
      language,
      aborted
        ? `The sandbox did not answer within ${REMOTE_TIMEOUT_MS / 1000} seconds. It may be busy — try again.`
        : "The remote sandbox is unreachable. Go and Java need a running code-runner (see NEXT_PUBLIC_CODE_RUNNER_URL).",
      performance.now() - startedAt,
    );
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------ single entry point */

/**
 * Runs a snippet in whichever sandbox the language needs.
 *
 * HTML, CSS, Tailwind and React + MUI are handled by the preview pane, so they
 * report an explanatory error here rather than silently doing nothing.
 */
export async function runPlaygroundCode(options: {
  language: PlaygroundLanguage;
  code: string;
  /** Input tab text; ignored by the languages that do not read stdin. */
  stdin?: string;
  /** Editor file name, used as the remote sandbox's file name. */
  fileName?: string;
  onStatus?: (message: string) => void;
}): Promise<RunResult> {
  const { language, code, stdin, fileName = "main.txt", onStatus } = options;

  if (language === "javascript" || language === "typescript") {
    return runScript({ code, language, stdin });
  }

  if (language === "python") {
    return runPython({ code, stdin, onStatus });
  }

  if (language === "sql") {
    return runSql({ code, onStatus });
  }

  if (language === "go" || language === "java") {
    return runRemote({ language, code, stdin, fileName, onStatus });
  }

  return errorResult(
    language,
    "HTML, CSS, Tailwind and React render in the preview pane instead of the runner.",
  );
}