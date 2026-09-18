/// <reference lib="webworker" />
import { formatValue, matchesExpected } from "../lib/practice/compare";
import { stripTypeScript } from "../lib/practice/strip-types";
import type { CompareMode } from "../lib/practice/types";

/**
 * Sandboxed code runner.
 *
 * User solutions are evaluated inside this worker so an accidental infinite
 * loop cannot freeze the page — the main thread terminates the worker and
 * recreates it when a run exceeds its budget.
 *
 * This is a *practice* environment, not a security boundary: it isolates
 * performance and DOM access, but it is not a hardened multi-tenant sandbox.
 */

export interface RunCase {
  index: number;
  args: unknown[];
  expected: unknown;
  compareMode: CompareMode;
  isHidden: boolean;
}

export interface RunRequest {
  id: number;
  code: string;
  language: "javascript" | "typescript";
  functionName: string;
  cases: RunCase[];
}

export interface CaseResult {
  index: number;
  passed: boolean;
  actual?: unknown;
  actualText?: string;
  error?: string;
  durationMs: number;
  timedOut?: boolean;
}

export interface RunResponse {
  id: number;
  ok: boolean;
  /** Populated when the whole submission failed to evaluate. */
  error?: string;
  /** Line/column hint derived from the error stack, when available. */
  location?: string;
  results: CaseResult[];
  /** Captured `console.log` / `console.error` output. */
  logs: string[];
  /** True when the code was TypeScript and had to be transpiled. */
  transpiled: boolean;
}

const MAX_LOG_LINES = 60;
const MAX_LOG_LINE_LENGTH = 400;

/** Builds a callable from user source, preferring a named function. */
function resolveFunction(
  fn: (...args: unknown[]) => unknown,
  functionName: string,
): (...args: unknown[]) => unknown {
  return fn;
}

function captureConsole(logs: string[]) {
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  const record = (level: string) => (...args: unknown[]) => {
    if (logs.length >= MAX_LOG_LINES) return;
    const text = args
      .map((value) => (typeof value === "string" ? value : formatValue(value, MAX_LOG_LINE_LENGTH)))
      .join(" ");
    logs.push(level === "log" ? text : `[${level}] ${text}`);
  };

  console.log = record("log");
  console.info = record("info");
  console.warn = record("warn");
  console.error = record("error");

  return () => {
    console.log = original.log;
    console.info = original.info;
    console.warn = original.warn;
    console.error = original.error;
  };
}

/** Extracts `line:column` from an error stack so the editor can highlight it. */
function locationFromStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const match = stack.match(/<anonymous>:(\d+):(\d+)/) ?? stack.match(/:(\d+):(\d+)\)?$/m);
  return match ? `line ${match[1]}, column ${match[2]}` : undefined;
}

function execute(request: RunRequest): RunResponse {
  const { code, language, functionName, cases } = request;
  const logs: string[] = [];

  const source = language === "typescript" ? stripTypeScript(code).code : code;
  const transpiled = language === "typescript" && source !== code;

  let userFunction: (...args: unknown[]) => unknown;

  const restoreConsole = captureConsole(logs);
  try {
    // `new Function` keeps the user's scope isolated from this worker's module.
    const factory = new Function(
      `"use strict";\n${source}\n;return typeof ${functionName} === "function" ? ${functionName} : undefined;`,
    );
    const resolved = factory();
    if (typeof resolved !== "function") {
      return {
        id: request.id,
        ok: false,
        error: `No function named \`${functionName}\` was found. Keep the given signature so the tests can call it.`,
        results: [],
        logs,
        transpiled,
      };
    }
    userFunction = resolveFunction(resolved as (...args: unknown[]) => unknown, functionName);
  } catch (error) {
    const err = error as Error;
    return {
      id: request.id,
      ok: false,
      error: `${err.name}: ${err.message}`,
      location: locationFromStack(err.stack),
      results: [],
      logs,
      transpiled,
    };
  } finally {
    restoreConsole();
  }

  const results: CaseResult[] = [];

  for (const testCase of cases) {
    const started = performance.now();
    const restore = captureConsole(logs);
    try {
      const actual = userFunction(...testCase.args);
      const passed = matchesExpected(actual, testCase.expected, testCase.compareMode);
      results.push({
        index: testCase.index,
        passed,
        actual,
        actualText: formatValue(actual),
        durationMs: performance.now() - started,
      });
    } catch (error) {
      const err = error as Error;
      results.push({
        index: testCase.index,
        passed: false,
        error: `${err.name}: ${err.message}`,
        durationMs: performance.now() - started,
      });
    } finally {
      restore();
    }
  }

  return { id: request.id, ok: true, results, logs, transpiled };
}

self.onmessage = (event: MessageEvent<RunRequest>) => {
  const request = event.data;
  try {
    self.postMessage(execute(request));
  } catch (error) {
    const err = error as Error;
    self.postMessage({
      id: request.id,
      ok: false,
      error: `${err.name}: ${err.message}`,
      results: [],
      logs: [],
      transpiled: false,
    } satisfies RunResponse);
  }
};