/**
 * SQLite runner for the DevAssess playground.
 *
 * Like the Python worker, this file lives in `public/` on purpose: Webpack
 * rewrites `importScripts()` inside bundled workers, and sql.js ships its own
 * loader plus a `.wasm` binary that has to be fetched from the CDN untouched.
 *
 * The database is created once per worker and kept for the life of the tab, so
 * a table you CREATE in one run is still there in the next one. A small demo
 * schema (departments + employees) is seeded up front so the first query has
 * something to read.
 *
 * Protocol
 *   in : { id, code }
 *   out: { id, type: "status", message }
 *        { id, type: "ready" }
 *        { id, type: "done", ok, logs, tables, error?, durationMs }
 */

var SQLJS_VERSION = "1.11.0";
var SQLJS_BASE = "https://cdn.jsdelivr.net/npm/sql.js@" + SQLJS_VERSION + "/dist/";

var databasePromise = null;
var busy = false;

/** Demo schema + rows, executed the first time the worker boots. */
var SEED_SQL = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  role TEXT NOT NULL,
  salary INTEGER NOT NULL,
  hired_on TEXT NOT NULL
);

INSERT INTO departments (id, name, city) VALUES
  (1, 'Engineering', 'Dhaka'),
  (2, 'Design', 'Sylhet'),
  (3, 'Data', 'Chattogram'),
  (4, 'Support', 'Dhaka');

INSERT INTO employees (id, name, department_id, role, salary, hired_on) VALUES
  (1, 'Ayesha Rahman', 1, 'Backend Engineer', 95000, '2022-03-14'),
  (2, 'Tanvir Hossain', 1, 'Frontend Engineer', 88000, '2021-11-02'),
  (3, 'Nusrat Jahan', 2, 'Product Designer', 82000, '2023-01-09'),
  (4, 'Rakib Hasan', 3, 'Data Analyst', 78000, '2023-06-21'),
  (5, 'Farhana Akter', 1, 'Engineering Manager', 132000, '2019-08-30'),
  (6, 'Imran Chowdhury', 4, 'Support Lead', 64000, '2022-09-05'),
  (7, 'Sadia Islam', 3, 'ML Engineer', 118000, '2021-02-17'),
  (8, 'Mehedi Hasan', 2, 'UX Researcher', 76000, '2024-04-01');
`;

/** Loads (once) and resolves with an initialised SQLite database. */
function loadDatabase(id) {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise(function (resolve, reject) {
    self.postMessage({
      id: id,
      type: "status",
      message: "Downloading the SQLite runtime (about 1.5 MB on the first run)…",
    });

    try {
      importScripts(SQLJS_BASE + "sql-wasm.js");
    } catch (error) {
      reject(
        new Error(
          "The SQLite runtime could not be downloaded from " +
            SQLJS_BASE +
            ". Check your network connection and run again."
        )
      );
      return;
    }

    if (typeof self.initSqlJs !== "function") {
      reject(new Error("The SQLite runtime loaded but did not expose initSqlJs()."));
      return;
    }

    self
      .initSqlJs({ locateFile: function (file) { return SQLJS_BASE + file; } })
      .then(function (SQL) {
        var database = new SQL.Database();
        database.run(SEED_SQL);
        self.postMessage({ id: id, type: "ready" });
        resolve(database);
      })
      .catch(reject);
  });

  return databasePromise;
}

function fail(id, error, startedAt) {
  var message = error && error.message ? String(error.message) : String(error);
  self.postMessage({
    id: id,
    type: "done",
    ok: false,
    logs: [{ level: "error", text: message }],
    tables: [],
    error: message,
    durationMs: Date.now() - startedAt,
  });
}

/** Turns sql.js result sets into the console pane's table shape. */
function toTables(results) {
  return results
    .filter(function (result) { return result.columns && result.columns.length; })
    .map(function (result) {
      return {
        columns: result.columns,
        rows: result.values.map(function (row) {
          return row.map(function (value) {
            if (value === null || value === undefined) return "NULL";
            return String(value);
          });
        }),
      };
    });
}

self.onmessage = function (event) {
  var request = event.data || {};
  var id = request.id;
  var code = typeof request.code === "string" ? request.code : "";
  var startedAt = Date.now();

  if (busy) {
    fail(id, new Error("A previous query is still running. Try again in a moment."), startedAt);
    return;
  }

  if (!code.trim()) {
    fail(id, new Error("Write a query before running it."), startedAt);
    return;
  }

  busy = true;

  loadDatabase(id)
    .then(function (database) {
      self.postMessage({ id: id, type: "status", message: "Executing statement(s)…" });

      var results = database.exec(code);
      var tables = toTables(results);
      var rowCount = tables.reduce(function (sum, table) { return sum + table.rows.length; }, 0);
      var logs = [
        {
          level: "system",
          text:
            tables.length === 0
              ? "Statement executed. No result set (use SELECT to see rows)."
              : tables.length + " result set(s), " + rowCount + " row(s).",
        },
      ];

      self.postMessage({
        id: id,
        type: "done",
        ok: true,
        logs: logs,
        tables: tables,
        durationMs: Date.now() - startedAt,
      });
    })
    .catch(function (error) {
      fail(id, error, startedAt);
    })
    .then(function () {
      busy = false;
    });
};
