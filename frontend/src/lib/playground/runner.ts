"use client";

import type { PlaygroundRunRequest, PlaygroundRunResponse } from "@/workers/playground.worker";
import {
  PYTHON_LOAD_TIMEOUT_MS,
  PYTHON_RUN_TIMEOUT_MS,
  PYTHON_WORKER_URL,
  SCRIPT_TIMEOUT_MS,
} from "./limits";
import type { ConsoleLine, PlaygroundLanguage, RunResult } from "./types";

/**
 * Main-thread bridge to the playground sandboxes (requirement 3).
 *
 * Two runtimes live behind this module:
 *
 * - **JavaScript / TypeScript** run in a *bundled* Web Worker created per run,
 *   so a snippet stuck in an infinite loop can always be terminated.
 * - **Python** is delegated to the Pyodide WebAssembly runtime running in a
 *   plain worker served from `public/playground/`. That worker is created once
 *   and kept warm, because booting CPython costs a ~10 MB download.
 *
 * HTML and CSS never reach this module — they render in the preview pane.
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
}): Promise<RunResult> {
  const { code, language } = options;

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
    let timer: ReturnType<typeof setTimeout>;

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    timer = setTimeout(() => {
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

    const request: PlaygroundRunRequest = { id: requestId, code, language };
    worker.postMessage(request);
  });
}

/* --------------------------------------------------------------- Python */

/** Reports whether the Python runtime is loaded (used for UI copy). */
export function isPythonRuntimeReady(): boolean {
  return pythonReady;
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
  /** Receives runtime progress such as "Downloading the Python runtime…". */
  onStatus?: (message: string) => void;
}): Promise<RunResult> {
  const { code, onStatus } = options;

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
      let timer: ReturnType<typeof setTimeout>;

      const timeoutMs = pythonReady ? PYTHON_RUN_TIMEOUT_MS : PYTHON_LOAD_TIMEOUT_MS;

      const finish = (result: RunResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.onmessage = null;
        worker.onerror = null;
        resolve(result);
      };

      timer = setTimeout(() => {
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

      worker.postMessage({ id: requestId, code });
    });
  } finally {
    pythonBusy = false;
  }
}

/* ------------------------------------------------------ single entry point */

/**
 * Runs a snippet in whichever sandbox the language needs.
 *
 * HTML and CSS are handled by the preview pane, so they report an explanatory
 * error here rather than silently doing nothing.
 */
export async function runPlaygroundCode(options: {
  language: PlaygroundLanguage;
  code: string;
  onStatus?: (message: string) => void;
}): Promise<RunResult> {
  const { language, code, onStatus } = options;

  if (language === "javascript" || language === "typescript") {
    return runScript({ code, language });
  }

  if (language === "python") {
    return runPython({ code, onStatus });
  }

  return errorResult(language, "HTML and CSS render in the preview pane instead of the runner.");
}