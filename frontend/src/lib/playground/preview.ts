import type { ConsoleLevel, ConsoleLine, PlaygroundLanguage } from "./types";

/**
 * Live-preview documents for HTML and CSS.
 *
 * The preview pane renders an iframe (`sandbox="allow-scripts …"`) built from
 * the user's source. A tiny bridge script is injected into every document so
 * `console.log`, runtime errors and unhandled rejections show up in the console
 * panel instead of disappearing into the iframe.
 *
 * HTML previews also get the Tailwind Play CDN (pinned to the version the app
 * compiles with), so utility classes in the markup are compiled inside the
 * iframe — no build step, no stylesheet import for the user to remember.
 */

/** Marker that identifies messages coming from our own preview iframe. */
export const PREVIEW_MESSAGE_SOURCE = "devassess-playground";

/** Tailwind Play CDN, pinned to the Tailwind version the frontend compiles with. */
export const TAILWIND_CDN_URL = "https://cdn.tailwindcss.com/3.4.19";

/** Injected into HTML previews so utility classes are compiled in the iframe. */
const TAILWIND_CDN_SNIPPET = `<script src="${TAILWIND_CDN_URL}"></script>`;

/** True when the user's markup already loads a Tailwind runtime itself. */
function hasTailwind(source: string): boolean {
  return /cdn\.tailwindcss\.com|@tailwindcss\/browser|tailwindcss\/dist/i.test(source);
}

/** Tailwind snippet for a document, or an empty string when the user has it. */
function tailwindSnippet(source: string): string {
  return hasTailwind(source) ? "" : TAILWIND_CDN_SNIPPET;
}

/** Minimal reset so a bare stylesheet still renders something sensible. */
const BASE_STYLES = `html { color-scheme: light dark; }
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }`;

/** Forwards iframe console output to the parent window. */
const PREVIEW_BRIDGE = `<script>
(function () {
  var MARKER = "${PREVIEW_MESSAGE_SOURCE}";

  function send(level, text) {
    try {
      parent.postMessage({ source: MARKER, level: level, text: String(text) }, "*");
    } catch (error) {
      /* posting to the parent is always allowed from a sandboxed frame */
    }
  }

  function stringify(value) {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  ["log", "info", "debug", "warn", "error"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i += 1) parts.push(stringify(arguments[i]));
      send(level === "log" || level === "info" || level === "debug" ? "log" : level, parts.join(" "));
      if (original) original.apply(console, arguments);
    };
  });

  window.addEventListener("error", function (event) {
    send("error", event.message + " (line " + event.lineno + ":" + event.colno + ")");
  });

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    send(
      "error",
      "Unhandled promise rejection: " + (reason && reason.message ? reason.message : stringify(reason))
    );
  });
})();
</script>`;

/**
 * Sample page the user's stylesheet is applied to.
 *
 * Class names intentionally match the CSS starter snippet so the first Run
 * shows an obvious, immediate effect.
 */
const SAMPLE_PAGE = `<article class="card">
  <p class="card__eyebrow">Live preview</p>
  <h1 class="card__title">Styled by your CSS</h1>
  <p class="card__text">
    Pick any selector on the left and the result appears here straight away.
  </p>
  <button class="button" type="button">Primary action</button>
  <ul class="chips">
    <li class="chip">Layout</li>
    <li class="chip">Colour</li>
    <li class="chip">Typography</li>
  </ul>
</article>`;

/** Inserts `snippet` just before the last occurrence of `tag`, or appends it. */
function injectBefore(documentText: string, tag: string, snippet: string): string {
  const index = documentText.toLowerCase().lastIndexOf(tag);
  if (index === -1) return `${documentText}\n${snippet}`;
  return `${documentText.slice(0, index)}${snippet}\n${documentText.slice(index)}`;
}

/** Wraps an HTML fragment in a minimal, script-enabled document. */
function wrapFragment(fragment: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
${tailwindSnippet(fragment)}
<style>${BASE_STYLES}</style>
</head>
<body>
${fragment}
${PREVIEW_BRIDGE}
</body>
</html>`;
}

/**
 * Builds the `srcDoc` for the preview pane.
 *
 * - `html` is used verbatim when it looks like a full document, otherwise it is
 *   wrapped in a document shell. HTML documents always get the Tailwind Play
 *   CDN (unless they ship their own Tailwind runtime) so class-based layouts
 *   render exactly as authored.
 * - `css` is applied on top of the built-in sample page.
 * - `tailwind` is the dedicated Tailwind compiler tab: the CDN is injected
 *   *first* in `<head>` so a later `tailwind.config` block themes the build.
 * - `reactmui` mounts the user's JSX component with React, Material UI and
 *   Babel standalone, all loaded from a CDN inside the sandboxed frame.
 */
export function buildPreviewDocument(
  language: PlaygroundLanguage,
  code: string,
): string {
  if (language === "css") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${BASE_STYLES}</style>
<style>
${code}
</style>
</head>
<body>
${SAMPLE_PAGE}
${PREVIEW_BRIDGE}
</body>
</html>`;
  }

  if (language === "reactmui") {
    return muiDocument(code);
  }

  const source = code.trim();

  if (language === "tailwind") {
    if (!source) return wrapFragment("<p style=\"padding:24px\">Nothing to preview yet.</p>");
    const looksLikeDocument = /<html[\s>]/i.test(source) || /<!doctype/i.test(source);
    if (!looksLikeDocument) return wrapFragment(source);
    const withTailwind = hasTailwind(source) ? source : insertAfterHead(source, TAILWIND_CDN_SNIPPET);
    return injectBefore(withTailwind, "</body>", PREVIEW_BRIDGE);
  }

  if (!source) return wrapFragment("<p style=\"padding:24px\">Nothing to preview yet.</p>");

  const looksLikeDocument = /<html[\s>]/i.test(source) || /<!doctype/i.test(source);
  if (!looksLikeDocument) return wrapFragment(source);

  // A full document: keep it as the user wrote it and only append the bridge.
  const withTailwind = hasTailwind(source)
    ? source
    : injectBefore(source, "</head>", TAILWIND_CDN_SNIPPET);
  return injectBefore(withTailwind, "</body>", PREVIEW_BRIDGE);
}

/**
 * Converts a `message` event payload into a console line.
 *
 * Returns `null` for anything that is not one of our preview messages, so the
 * listener can safely ignore unrelated traffic.
 */
export function parsePreviewMessage(data: unknown): ConsoleLine | null {
  if (typeof data !== "object" || data === null) return null;

  const payload = data as { source?: unknown; level?: unknown; text?: unknown };
  if (payload.source !== PREVIEW_MESSAGE_SOURCE) return null;
  if (typeof payload.text !== "string") return null;

  const level = payload.level;
  const known: ConsoleLevel[] = ["log", "info", "warn", "error", "system"];
  return {
    level: known.includes(level as ConsoleLevel) ? (level as ConsoleLevel) : "log",
    text: payload.text,
  };
}
