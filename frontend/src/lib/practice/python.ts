import type { CaseResult, RunCase } from "@/workers/code-runner.worker";
import type { ConsoleLine } from "@/lib/playground/types";
import { formatValue, matchesExpected } from "./compare";

/**
 * Python support for the practice arena.
 *
 * A solution is executed by the same Pyodide runtime the playground boots (see
 * `lib/playground/runner.ts`), but a grading run needs values back instead of
 * printed output. Rather than extending the worker protocol, the harness below
 * is appended to the user's code: it calls the solution once per test case and
 * prints one marked JSON line per case. The marked lines are parsed on the main
 * thread, where the *same* comparison helpers used by the JavaScript worker
 * (`matchesExpected`) decide pass/fail — so both languages are graded alike.
 */

/** Prefix of every harness line; anything else is the user's own output. */
export const PYTHON_RESULT_MARKER = "__DEVASSESS_RESULT__";

/**
 * Python name of the solution function: `twoSum` → `two_sum`.
 *
 * Python solutions are authored with PEP 8 names, so the camelCase name from the
 * problem definition is converted on both sides (starter code and harness).
 */
export function pythonFunctionName(functionName: string): string {
  return functionName
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .toLowerCase();
}

/** Names the harness accepts, snake_case first (camelCase is tolerated). */
function acceptedNames(functionName: string): string[] {
  const snake = pythonFunctionName(functionName);
  return snake === functionName ? [snake] : [snake, functionName];
}

/** Builds the graded program: harness prelude + user code + the test loop. */
export function buildPythonHarness(options: {
  code: string;
  functionName: string;
  cases: RunCase[];
}): string {
  const { code, functionName, cases } = options;

  // Only the arguments are shipped to Python — the expected values stay here,
  // where `matchesExpected` compares them.
  const payload = cases.map((testCase) => ({
    index: testCase.index,
    args: testCase.args,
  }));

  const names = acceptedNames(functionName)
    .map((name) => `"${name}"`)
    .join(", ");
  const marker = JSON.stringify(PYTHON_RESULT_MARKER);
  const casesLiteral = JSON.stringify(JSON.stringify(payload));

  return `# ------------------------------------------------- DevAssess harness ---
import json as __devassess_json
import time as __devassess_time

__devassess_cases = __devassess_json.loads(${casesLiteral})
__devassess_names = [${names}]
__devassess_wanted = "${pythonFunctionName(functionName)}"


def __devassess_emit(payload):
    print(${marker} + payload)


def __devassess_dumps(value):
    try:
        return __devassess_json.dumps(value, default=str)
    except Exception:
        return __devassess_json.dumps(repr(value))


def __devassess_millis(started):
    return round((__devassess_time.perf_counter() - started) * 1000, 3)


# A previous run in this session may have defined the same name; drop it so a
# stale function can never answer this run's tests.
for __devassess_name in __devassess_names:
    globals().pop(__devassess_name, None)

# -------------------------------------------------------------- your code ---
${code}

# ----------------------------------------------------------- test runner ---
def __devassess_resolve():
    for __devassess_name in __devassess_names:
        __devassess_candidate = globals().get(__devassess_name)
        if callable(__devassess_candidate):
            return __devassess_candidate
    raise NameError(
        "No function named '" + __devassess_wanted + "' was found. "
        "Keep the given signature so the tests can call it."
    )


try:
    __devassess_solution = __devassess_resolve()
except Exception as __devassess_error:
    __devassess_emit(
        __devassess_json.dumps({"fatal": type(__devassess_error).__name__ + ": " + str(__devassess_error)})
    )
else:
    for __devassess_case in __devassess_cases:
        __devassess_started = __devassess_time.perf_counter()
        try:
            __devassess_value = __devassess_solution(*__devassess_case["args"])
        except Exception as __devassess_error:
            __devassess_emit(
                '{"index": %d, "ms": %s, "error": %s}'
                % (
                    __devassess_case["index"],
                    __devassess_millis(__devassess_started),
                    __devassess_dumps(type(__devassess_error).__name__ + ": " + str(__devassess_error)),
                )
            )
        else:
            __devassess_emit(
                '{"index": %d, "ms": %s, "value": %s}'
                % (
                    __devassess_case["index"],
                    __devassess_millis(__devassess_started),
                    __devassess_dumps(__devassess_value),
                )
            )
`;
}


interface HarnessLine {
  index?: number;
  ms?: number;
  value?: unknown;
  error?: string;
  fatal?: string;
}

/** Splits the runtime logs into marked harness lines and the user's output. */
function readHarnessLines(logs: ConsoleLine[]): { lines: HarnessLine[]; output: string[] } {
  const lines: HarnessLine[] = [];
  const output: string[] = [];

  for (const entry of logs) {
    for (const raw of entry.text.split("\n")) {
      const text = raw.trimEnd();
      if (!text.trim()) continue;

      if (!text.startsWith(PYTHON_RESULT_MARKER)) {
        output.push(text);
        continue;
      }

      try {
        lines.push(JSON.parse(text.slice(PYTHON_RESULT_MARKER.length)) as HarnessLine);
      } catch {
        // A malformed line is not worth failing the whole run over.
      }
    }
  }

  return { lines, output };
}

export interface PythonRunOutcome {
  results: CaseResult[];
  /** Set when the whole submission failed (missing function, syntax error). */
  fatal?: string;
  /** The user's `print` output, without the harness lines. */
  output: string[];
}

/**
 * Turns a graded Python run into the same `CaseResult[]` the JS worker returns.
 *
 * Cases the harness never reported (the program aborted early) are reported as
 * failures so the summary still accounts for every test.
 */
export function parsePythonResults(logs: ConsoleLine[], cases: RunCase[]): PythonRunOutcome {
  const { lines, output } = readHarnessLines(logs);
  const byIndex = new Map<number, HarnessLine>();
  let fatal: string | undefined;

  for (const line of lines) {
    if (line.fatal) fatal = line.fatal;
    else if (typeof line.index === "number") byIndex.set(line.index, line);
  }

  const results: CaseResult[] = cases.map((testCase) => {
    const line = byIndex.get(testCase.index);
    const durationMs = line?.ms ?? 0;

    if (!line) {
      return {
        index: testCase.index,
        passed: false,
        error: fatal ?? "This test did not finish. Check for infinite loops or early exits.",
        durationMs,
      };
    }

    if (line.error) {
      return { index: testCase.index, passed: false, error: line.error, durationMs };
    }

    const actual = line.value;
    return {
      index: testCase.index,
      passed: matchesExpected(actual, testCase.expected, testCase.compareMode),
      actual,
      actualText: formatValue(actual),
      durationMs,
    };
  });

  return { results, fatal, output };
}
