/**
 * Pyodide-backed Python runner for the DevAssess playground.
 *
 * This file lives in `public/` on purpose: Webpack rewrites `importScripts()`
 * inside bundled workers, so the Pyodide CDN loader has to run in a plain,
 * classic worker that the bundler never touches.
 *
 * The runtime is downloaded once per browser session and then kept warm: the
 * main thread reuses the same worker instance, so only the very first run pays
 * the download cost.
 *
 * The Python session itself is persistent for the life of the tab (a REPL-like
 * behaviour): a name defined in one run is still bound in the next run, which
 * is what users expect from a scratchpad and is called out in the UI copy.
 *
 * Protocol
 *   in : { id, code }
 *   out: { id, type: "status", message }
 *        { id, type: "ready" }
 *        { id, type: "done", ok, logs: { level, text }[], error?, durationMs }
 *
 * Logs carry a level (`log` for stdout, `warn` for stderr, `error` for the
 * traceback) so the console pane can colour them without guessing.
 */

var PYODIDE_VERSION = "0.26.4";
var PYODIDE_BASE = "https://cdn.jsdelivr.net/pyodide/v" + PYODIDE_VERSION + "/full/";

var runtimePromise = null;
var busy = false;

/** Filters Pyodide's internal frames out of a Python traceback. */
function trimTraceback(message) {
  var text = String(message || "Python error");
  var lines = text.split("\n");
  var kept = lines.filter(function (line) {
    return line.indexOf('File "<exec>"') !== -1 || /Error|Exception|Warning/.test(line);
  });
  if (kept.length === 0) kept = lines.slice(-6);
  return kept.join("\n").trim();
}

/** Loads (once) and resolves with the Pyodide instance. */
function loadRuntime(id) {
  if (runtimePromise) return runtimePromise;

  runtimePromise = new Promise(function (resolve, reject) {
    self.postMessage({
      id: id,
      type: "status",
      message:
        "Downloading the Python runtime (about 10 MB on the first run, then cached by the browser)…",
    });

    try {
      importScripts(PYODIDE_BASE + "pyodide.js");
    } catch (error) {
      reject(
        new Error(
          "The Python runtime could not be downloaded from " +
            PYODIDE_BASE +
            ". Check your network connection and run again."
        )
      );
      return;
    }

    if (typeof self.loadPyodide !== "function") {
      reject(new Error("The Python runtime loaded but did not expose loadPyodide()."));
      return;
    }

    self
      .loadPyodide({ indexURL: PYODIDE_BASE })
      .then(function (pyodide) {
        self.postMessage({ id: id, type: "ready" });
        resolve(pyodide);
      })
      .catch(reject);
  });

  return runtimePromise;
}

function fail(id, error, startedAt) {
  var message = error && error.message ? String(error.message) : String(error);
  self.postMessage({
    id: id,
    type: "done",
    ok: false,
    logs: [{ level: "error", text: message }],
    error: message,
    durationMs: Date.now() - startedAt,
  });
}

self.onmessage = function (event) {
  var request = event.data || {};
  var id = request.id;
  var code = typeof request.code === "string" ? request.code : "";
  var startedAt = Date.now();

  if (busy) {
    fail(id, new Error("A previous Python run is still in progress. Try again in a moment."), startedAt);
    return;
  }

  if (!code.trim()) {
    fail(id, new Error("Write some code before running it."), startedAt);
    return;
  }

  busy = true;
  var logs = [];

  loadRuntime(id)
    .then(function (pyodide) {
      pyodide.setStdout({
        batched: function (text) {
          if (text) logs.push({ level: "log", text: String(text) });
        },
      });
      pyodide.setStderr({
        batched: function (text) {
          if (text) logs.push({ level: "warn", text: String(text) });
        },
      });

      self.postMessage({ id: id, type: "status", message: "Executing script…" });

      return pyodide.runPythonAsync(code).then(
        function () {
          self.postMessage({
            id: id,
            type: "done",
            ok: true,
            logs: logs,
            durationMs: Date.now() - startedAt,
          });
        },
        function (error) {
          var message = trimTraceback(error && error.message ? error.message : error);
          logs.push({ level: "error", text: message });
          self.postMessage({
            id: id,
            type: "done",
            ok: false,
            logs: logs,
            error: message,
            durationMs: Date.now() - startedAt,
          });
        }
      );
    })
    .catch(function (error) {
      // A failed download must not poison the cache — the next Run retries.
      runtimePromise = null;
      fail(id, error, startedAt);
    })
    .then(function () {
      busy = false;
    });
};
