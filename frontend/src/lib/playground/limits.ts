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
