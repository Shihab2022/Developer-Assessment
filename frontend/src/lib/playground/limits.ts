/**
 * Execution limits for the online compiler playground.
 *
 * These live in their own module (no `"use client"`) so the server-rendered
 * page can quote the numbers in its copy without importing the client runner.
 */

import { CODE_RUNNER_URL } from "@/lib/env";

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
 * Optional Piston v2 endpoint for the languages that cannot run in a browser
 * (Go and Java).
 *
 * The public Piston API turned whitelist-only on 2026-02-15, so it is no longer
 * the default. Without this variable the playground uses its own same-origin
 * proxy route (`/api/playground/execute`), which talks to the official Go
 * playground and the public Judge0 instance from the server — neither allows
 * CORS calls from a browser tab. Pointing this at your own (or whitelisted)
 * Piston makes it the preferred runner, with the proxy as fallback.
 */
export const REMOTE_RUNNER_URL = CODE_RUNNER_URL;

/** Same-origin proxy that fans Go/Java out to the public sandboxes. */
export const REMOTE_PROXY_URL = "/api/playground/execute";
