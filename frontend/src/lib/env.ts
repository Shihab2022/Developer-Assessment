/**
 * Absolute, shareable links for this frontend.
 *
 * Share links MUST come from `NEXT_PUBLIC_SITE_URL` (see `.env.example`), so a
 * deployment can publish the public origin once instead of leaking wherever
 * the recruiter's browser happens to be (`window.location.origin` is only the
 * local host during development).
 * Only `NEXT_PUBLIC_*` variables are referenced in this module: Next.js inlines
 * them into the browser bundle, so they must never hold secrets.
 * Every external URL the app depends on is read here — and only here — so a
 * deployment can point at different hosts without editing code. Each value has
 * a local-development fallback, which means the app still runs with no `.env`
 * at all. The full list, with an explanation of each variable, lives in
 * `.env.example` at the project root.
 */

/** Trims a value and returns `undefined` when it is empty. */
function nonEmpty(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

/** Reads a URL, dropping any trailing slash and falling back when unset. */
function readUrl(value: string | undefined, fallback: string): string {
  return (nonEmpty(value) ?? fallback).replace(/\/+$/, "");
}

/** Reads a directory-style URL, guaranteeing a single trailing slash. */
function readBase(value: string | undefined, fallback: string): string {
  return `${(nonEmpty(value) ?? fallback).replace(/\/+$/, "")}/`;
}

/** Reads an optional URL; `null` when the variable is unset or blank. */
function readOptional(value: string | undefined): string | null {
  return nonEmpty(value) ?? null;
}

/** Backend REST API base, including the `/api/v1` prefix. */
export const API_BASE_URL = readUrl(
  process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:5000/api/v1",
);

/** Canonical origin of this frontend (Open Graph, share links, metadata). */
export const SITE_URL = readUrl(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000");

/**
 * Builds an absolute, shareable URL for an in-app path — always rooted at
 * `SITE_URL`, never at `window.location.origin` (requirement 1).
 */
export const publicUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Public source repository — linked from the footer and quoted in the UA string. */
export const REPO_URL = readUrl(
  process.env.NEXT_PUBLIC_REPO_URL,
  "https://github.com/Shihab2022/Developer-Assessment",
);

/** Optional self-hosted Piston-compatible runner for the Go and Java tabs. */
export const CODE_RUNNER_URL = readOptional(process.env.NEXT_PUBLIC_CODE_RUNNER_URL);

/**
 * Third-party runtimes the playground loads inside sandboxed iframes and Web
 * Workers. Every asset is pinned to a version by default, so the playground
 * works with no configuration; override these to self-host the assets.
 */
export const PLAYGROUND_CDNS = {
  /** Tailwind Play CDN, compiled inside HTML/Tailwind previews. */
  tailwind: readUrl(
    process.env.NEXT_PUBLIC_PLAYGROUND_TAILWIND_CDN_URL,
    "https://cdn.tailwindcss.com/3.4.19",
  ),
  /** React UMD build for the React + MUI preview tab. */
  react: readUrl(
    process.env.NEXT_PUBLIC_PLAYGROUND_REACT_CDN_URL,
    "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  ),
  /** ReactDOM UMD build for the React + MUI preview tab. */
  reactDom: readUrl(
    process.env.NEXT_PUBLIC_PLAYGROUND_REACT_DOM_CDN_URL,
    "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
  ),
  /** Material UI UMD build for the React + MUI preview tab. */
  mui: readUrl(
    process.env.NEXT_PUBLIC_PLAYGROUND_MUI_CDN_URL,
    "https://unpkg.com/@mui/material@5.15.20/umd/material-ui.production.min.js",
  ),
  /** Babel standalone, which compiles JSX inside the preview iframe. */
  babel: readUrl(
    process.env.NEXT_PUBLIC_PLAYGROUND_BABEL_CDN_URL,
    "https://unpkg.com/@babel/standalone@7.24.7/babel.min.js",
  ),
  /** Roboto stylesheet used by the React + MUI preview. */
  font: readUrl(
    process.env.NEXT_PUBLIC_PLAYGROUND_FONT_URL,
    "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
  ),
  /** Pyodide runtime directory loaded by the Python worker (trailing slash). */
  pyodide: readBase(
    process.env.NEXT_PUBLIC_PYODIDE_CDN_BASE,
    "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  ),
  /** sql.js runtime directory loaded by the SQL worker (trailing slash). */
  sqljs: readBase(
    process.env.NEXT_PUBLIC_SQLJS_CDN_BASE,
    "https://cdn.jsdelivr.net/npm/sql.js@1.11.0/dist/",
  ),
} as const;
