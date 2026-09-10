/**
 * Vercel serverless entry point.
 *
 * `src/server.ts` boots a long-running HTTP server via `app.listen()`, which is
 * correct for Docker / Render / a VM but NOT for Vercel. Vercel's Node.js
 * runtime requires the module to export a request handler (an Express app or a
 * (req, res) function). If the module doesn't export a handler, every request
 * fails with `FUNCTION_INVOCATION_FAILED` (HTTP 500), which is this fix.
 *
 * Deploy pipeline (see vercel.json / package.json "vercel-build"):
 *   1. `npx prisma generate`  -> creates the Prisma client (generated/ is gitignored)
 *   2. `@vercel/node` compiles this file and bundles the app + dependencies.
 */
import app from "../src/app";

export default app;
