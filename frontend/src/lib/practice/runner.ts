"use client";

import type { CaseResult, RunCase, RunRequest, RunResponse } from "@/workers/code-runner.worker";
import { isPythonRuntimeReady, runPython } from "@/lib/playground/runner";
import type { PracticeLanguage, PracticeProblem } from "./types";
import { buildPythonHarness, parsePythonResults } from "./python";

/**
 * Main-thread bridge to the code runners.
 *
 * Two runtimes live behind this module:
 *
 * - **JavaScript / TypeScript** run in a *bundled* Web Worker created per run,
 *   so a submission stuck in an infinite loop can always be terminated: after
 *   `RUN_TIMEOUT_MS` the worker is killed and the run is reported as timed out,
 *   leaving the page responsive.
 * - **Python** is delegated to the Pyodide WebAssembly runtime, reusing the warm
 *   worker the playground boots (the ~10 MB download is shared between both
 *   features and happens once per tab). A graded run appends a test harness to
 *   the solution — see `./python`.
 */

export const RUN_TIMEOUT_MS = 5000;

export interface RunSummary {
  ok: boolean;
  error?: string;
  location?: string;
  results: CaseResult[];
  logs: string[];
  transpiled: boolean;
  passed: number;
  total: number;
  timedOut: boolean;
  durationMs: number;
}

function createWorker(): Worker {
  return new Worker(new URL("../../workers/code-runner.worker.ts", import.meta.url));
}

/** Human-readable call signature for a test case, e.g. `twoSum([2,7], 9)`. */
export function describeCase(functionName: string, args: unknown[]): string {
  const rendered = args
    .map((arg) => {
      if (typeof arg === "string") return JSON.stringify(arg);
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(", ");
  return `${functionName}(${rendered})`;
}

/** Builds the worker payload for a problem, optionally including hidden cases. */
export function buildCases(problem: PracticeProblem, includeHidden: boolean): RunCase[] {
  return problem.testCases
    .map((testCase, index) => ({ testCase, index }))
    .filter(({ testCase }) => includeHidden || !testCase.isHidden)
    .map(({ testCase, index }) => ({
      index,
      args: testCase.args,
      expected: testCase.expected,
      compareMode: testCase.compareMode ?? "exact",
      isHidden: Boolean(testCase.isHidden),
    }));
}

/**
 * Runs a solution against a problem's test cases.
 *
 * `includeHidden` is `false` for a Run (visible examples only) and `true` for a
 * Submit (the full suite). Python runs stream runtime progress through
 * `onStatus` because the first one downloads the WebAssembly runtime.
 */
export async function runTests(options: {
  code: string;
  language: PracticeLanguage;
  problem: PracticeProblem;
  includeHidden: boolean;
  timeoutMs?: number;
  onStatus?: (message: string) => void;
}): Promise<RunSummary> {
  const { code, language, problem, includeHidden, timeoutMs, onStatus } = options;
  const cases = buildCases(problem, includeHidden);

  if (language === "python") {
    return runPythonTests({ code, problem, cases, onStatus });
  }

  const startedAt = performance.now();

  if (!code.trim()) {
    return {
      ok: false,
      error: "Write some code before running the tests.",
      results: [],
      logs: [],
      transpiled: false,
      passed: 0,
      total: cases.length,
      timedOut: false,
      durationMs: 0,
    };
  }

  const budgetMs = timeoutMs ?? RUN_TIMEOUT_MS;

  const request: RunRequest = {
    id: Date.now(),
    code,
    language,
    functionName: problem.functionName,
    cases,
  };

  let worker: Worker;
  try {
    worker = createWorker();
  } catch {
    return {
      ok: false,
      error: "This browser could not start the code runner worker.",
      results: [],
      logs: [],
      transpiled: false,
      passed: 0,
      total: cases.length,
      timedOut: false,
      durationMs: performance.now() - startedAt,
    };
  }

  return new Promise<RunSummary>((resolve) => {
    let settled = false;

    const finish = (summary: RunSummary) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      resolve(summary);
    };

    const timer = setTimeout(() => {
      finish({
        ok: false,
        error: `Time limit exceeded (${budgetMs / 1000}s). Check for an infinite loop or an input that never shrinks.`,
        results: [],
        logs: [],
        transpiled: false,
        passed: 0,
        total: cases.length,
        timedOut: true,
        durationMs: performance.now() - startedAt,
      });
    }, budgetMs);

    worker.onmessage = (event: MessageEvent<RunResponse>) => {
      clearTimeout(timer);
      const response = event.data;
      if (!response || response.id !== request.id) return;

      const passed = response.results.filter((result) => result.passed).length;
      finish({
        ok: response.ok,
        error: response.error,
        location: response.location,
        results: response.results,
        logs: response.logs,
        transpiled: response.transpiled,
        passed,
        total: cases.length,
        timedOut: false,
        durationMs: performance.now() - startedAt,
      });
    };

    worker.onerror = (event) => {
      clearTimeout(timer);
      finish({
        ok: false,
        error: event.message || "The code runner crashed while executing your solution.",
        results: [],
        logs: [],
        transpiled: false,
        passed: 0,
        total: cases.length,
        timedOut: false,
        durationMs: performance.now() - startedAt,
      });
    };

    worker.postMessage(request);
  });
}

/* ---------------------------------------------------------------- python */

/**
 * Grades a Python solution with the shared Pyodide runtime.
 *
 * The harness appends a test loop to the user's code, so the solution is called
 * exactly the same way the JavaScript worker calls it: positional arguments in,
 * return value out. Comparison happens here with `matchesExpected`, which keeps
 * Python and JavaScript verdicts identical.
 */
async function runPythonTests(options: {
  code: string;
  problem: PracticeProblem;
  cases: RunCase[];
  onStatus?: (message: string) => void;
}): Promise<RunSummary> {
  const { code, problem, cases, onStatus } = options;
  const startedAt = performance.now();
  const statusLines: string[] = [];

  const program = buildPythonHarness({
    code,
    functionName: problem.functionName,
    cases,
  });

  const outcome = await runPython({
    code: program,
    onStatus: (message) => {
      statusLines.push(message);
      onStatus?.(message);
    },
  });

  const parsed = parsePythonResults(outcome.logs ?? [], cases);
  const passed = parsed.results.filter((result) => result.passed).length;
  const alreadyLogged = new Set(parsed.output);
  const timedOut = outcome.status === "timeout";

  return {
    ok: outcome.status === "success" && !parsed.fatal,
    // A whole-program failure wins over the per-case messages: a syntax error or
    // a missing function never reaches the test loop.
    error: parsed.fatal ?? (outcome.status === "success" ? undefined : outcome.error),
    results: parsed.results,
    logs: [...statusLines.filter((line) => !alreadyLogged.has(line)), ...parsed.output],
    transpiled: false,
    passed,
    total: cases.length,
    timedOut,
    durationMs: outcome.durationMs || performance.now() - startedAt,
  };
}

/** True once the Python runtime is warm (used to word the UI hint). */
export function isPythonReady(): boolean {
  return isPythonRuntimeReady();
}
