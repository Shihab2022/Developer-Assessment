/**
 * Execution limits for the online compiler playground.
 *
 * These live in their own module (no `"use client"`) so the server-rendered
 * page can quote the numbers in its copy without importing the client runner.
 */

/** Wall-clock budget for JavaScript / TypeScript snippets. */
export const SCRIPT_TIMEOUT_MS = 6_000;
/** The first Python run downloads the runtime, so it gets a bigger budget. */
export const PYTHON_LOAD_TIMEOUT_MS = 60_000;
/** Budget for Python runs once the runtime is warm. */
export const PYTHON_RUN_TIMEOUT_MS = 15_000;
/** Classic (unbundled) worker that boots Pyodide from the CDN. */
export const PYTHON_WORKER_URL = "/playground/python-worker.js";
/** The first SQL run downloads the SQLite WebAssembly runtime. */
export const SQL_LOAD_TIMEOUT_MS = 45_000;
/** Budget for SQL runs once the runtime is warm. */
export const SQL_RUN_TIMEOUT_MS = 20_000;
/** Classic (unbundled) worker that boots sql.js from the CDN. */
export const SQL_WORKER_URL = "/playground/sql-worker.js";
/** Budget for a remote (Go / Java) compile + run round-trip. */
export const REMOTE_TIMEOUT_MS = 30_000;

/**
 * Remote sandbox endpoint used for the languages that cannot run in a browser
 * (Go and Java). It speaks the Piston v2 protocol, so pointing this at a
 * self-hosted Piston instance — or at the platform's own runner — is a matter
 * of setting `NEXT_PUBLIC_CODE_RUNNER_URL`.
 */
export const REMOTE_RUNNER_URL =
  process.env.NEXT_PUBLIC_CODE_RUNNER_URL ?? "https://emkc.org/api/v2/piston/execute";
