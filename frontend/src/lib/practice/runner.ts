"use client";

import type { CaseResult, RunCase, RunRequest, RunResponse } from "@/workers/code-runner.worker";
import type { PracticeProblem } from "./types";

/**
 * Main-thread bridge to the code runner worker.
 *
 * A fresh worker is created per run so that a submission stuck in an infinite
 * loop can be terminated safely: after `RUN_TIMEOUT_MS` the worker is killed and
 * the run is reported as timed out, leaving the page responsive.
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

export async function runTests(options: {
  code: string;
  language: "javascript" | "typescript";
  problem: PracticeProblem;
  includeHidden: boolean;
  timeoutMs?: number;
}): Promise<RunSummary> {
  const { code, language, problem, includeHidden } = options;
  const timeoutMs = options.timeoutMs ?? RUN_TIMEOUT_MS;
  const cases = buildCases(problem, includeHidden);
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
        error: `Time limit exceeded (${timeoutMs / 1000}s). Check for an infinite loop or an input that never shrinks.`,
        results: [],
        logs: [],
        transpiled: false,
        passed: 0,
        total: cases.length,
        timedOut: true,
        durationMs: performance.now() - startedAt,
      });
    }, timeoutMs);

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