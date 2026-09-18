/// <reference lib="webworker" />
import { formatValue } from "../lib/practice/compare";
import { stripTypeScript } from "../lib/practice/strip-types";
import type { ConsoleLevel, ConsoleLine } from "../lib/playground/types";

/**
 * Program sandbox for the online compiler playground.
 *
 * Unlike the practice worker (which calls one exported function with test
 * arguments), this worker runs a *whole program*: the snippet is wrapped in an
 * async scope so top-level `await` works, `console` output is split into
 * stdout/stderr, and every network, storage and nested-worker global is
 * replaced by a proxy that throws — so a pasted snippet cannot call home.
 *
 * This is a convenience sandbox, not a security boundary: the worker isolates
 * performance and DOM access, but a determined snippet could still reach the
 * remaining worker globals.
 */

export interface PlaygroundRunRequest {
  id: number;
  code: string;
  language: "javascript" | "typescript";
}

export interface PlaygroundRunResponse {
  id: number;
  ok: boolean;
  /** Console output in the order the snippet produced it, with levels kept. */
  logs: ConsoleLine[];
  /** Set when the program failed (syntax error, throw, blocked global). */
  error?: string;
  /** `line x, column y` hint, adjusted for the wrapper the runner adds. */
  location?: string;
  durationMs: number;
  /** True when TypeScript annotations had to be stripped. */
  transpiled: boolean;
}

const MAX_LOG_LINES = 200;
const MAX_LOG_LINE_LENGTH = 500;

/**
 * Lines the runner adds in front of the user's snippet:
 * `"use strict";` and `return (async () => {`.
 */
const WRAPPER_OFFSET = 2;

/** Globals that are shadowed inside the user's scope. */
const BLOCKED_GLOBALS = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "EventSource",
  "importScripts",
  "Worker",
  "SharedWorker",
  "postMessage",
  "close",
  "indexedDB",
  "localStorage",
  "sessionStorage",
] as const;

/** A value that throws as soon as it is called, constructed or read. */
function blockedGlobal(name: string): unknown {
  const fail = () => {
    throw new Error(`\`${name}\` is not available in the playground sandbox.`);
  };

  return new Proxy(fail as unknown as object, {
    apply: () => fail(),
    construct: () => fail(),
    get: () => fail(),
    set: () => fail(),
  });
}

/** Routes `console` calls into the log list, preserving their level. */
function captureConsole(logs: ConsoleLine[]) {
  const original = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    warn: console.warn,
    error: console.error,
  };

  const write = (level: ConsoleLevel) => (...args: unknown[]) => {
    if (logs.length >= MAX_LOG_LINES) return;
    logs.push({
      level,
      text: args
        .map((value) =>
          typeof value === "string" ? value : formatValue(value, MAX_LOG_LINE_LENGTH),
        )
        .join(" "),
    });
  };

  console.log = write("log");
  console.info = write("info");
  console.debug = write("log");
  console.warn = write("warn");
  console.error = write("error");

  return () => {
    console.log = original.log;
    console.info = original.info;
    console.debug = original.debug;
    console.warn = original.warn;
    console.error = original.error;
  };
}

/** Extracts `line x, column y` from a stack trace, undoing the wrapper offset. */
function locationFromStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  const match = stack.match(/<anonymous>:(\d+):(\d+)/);
  if (!match) return undefined;

  const line = Math.max(1, Number(match[1]) - WRAPPER_OFFSET);
  return `line ${line}, column ${match[2]}`;
}

async function execute(request: PlaygroundRunRequest): Promise<PlaygroundRunResponse> {
  const { code, language } = request;
  const logs: ConsoleLine[] = [];
  const startedAt = performance.now();

  const base = {
    id: request.id,
    logs,
    transpiled: false,
  };

  if (!code.trim()) {
    return {
      ...base,
      ok: false,
      error: "Write some code before running it.",
      durationMs: 0,
    };
  }

  const stripped = language === "typescript" ? stripTypeScript(code) : undefined;
  const source = stripped ? stripped.code : code;
  const transpiled = Boolean(stripped && source !== code);

  const restoreConsole = captureConsole(logs);

  try {
    // A named parameter list keeps the blocked globals out of the snippet.
    const factory = new Function(
      ...BLOCKED_GLOBALS,
      `"use strict";\nreturn (async () => {\n${source}\n})();`,
    );

    const program = factory(...BLOCKED_GLOBALS.map(blockedGlobal)) as Promise<unknown>;
    await program;

    return { ...base, ok: true, durationMs: performance.now() - startedAt, transpiled };
  } catch (error) {
    const err = error as Error;
    const message = `${err.name ?? "Error"}: ${err.message}`;
    logs.push({ level: "error", text: message });

    return {
      ...base,
      ok: false,
      error: message,
      location: locationFromStack(err.stack),
      durationMs: performance.now() - startedAt,
      transpiled,
    };
  } finally {
    restoreConsole();
  }
}

self.onmessage = (event: MessageEvent<PlaygroundRunRequest>) => {
  const request = event.data;

  void execute(request)
    .then((response) => self.postMessage(response))
    .catch((error: unknown) => {
      const err = error as Error;
      const failure: PlaygroundRunResponse = {
        id: request.id,
        ok: false,
        logs: [{ level: "error", text: `${err.name}: ${err.message}` }],
        error: `${err.name}: ${err.message}`,
        durationMs: 0,
        transpiled: false,
      };
      self.postMessage(failure);
    });
};