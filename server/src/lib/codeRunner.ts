import vm from "node:vm";
import config from "../config";

export interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  output: string;
  passed: boolean;
  timeMs: number;
  error?: string;
}

export interface ExecutionResult {
  status: "PASSED" | "FAILED" | "PARTIAL" | "ERROR";
  score: number;
  passedCount: number;
  totalCount: number;
  testResults: TestCaseResult[];
  executionTime: number;
  memoryUsed: number;
  message: string;
}

export interface CodeRunner {
  execute(code: string, language: string, testCases: TestCaseInput[]): Promise<ExecutionResult>;
}

/**
 * Remote sandbox client — dispatches code to the isolated evaluation service
 * (container/worker). The API server never executes arbitrary code itself.
 */
class RemoteSandboxRunner implements CodeRunner {
  async execute(
    code: string,
    language: string,
    testCases: TestCaseInput[],
  ): Promise<ExecutionResult> {
    const { default: axios } = await import("axios");
    const { data } = await axios.post(`${config.code_runner_url}`, {
      code,
      language,
      testCases,
    });
    return data as ExecutionResult;
  }
}

/**
 * Local dev-only sandbox. Uses Node's `vm` module with a preloaded, read-only
 * context, a hard timeout and a captured stdio bridge. It only supports
 * JavaScript and must never be enabled in production.
 */
class LocalSandboxRunner implements CodeRunner {
  async execute(
    code: string,
    language: string,
    testCases: TestCaseInput[],
  ): Promise<ExecutionResult> {
    if (language !== "javascript" && language !== "typescript") {
      return {
        status: "ERROR",
        score: 0,
        passedCount: 0,
        totalCount: testCases.length,
        testResults: [],
        executionTime: 0,
        memoryUsed: 0,
        message: `Local sandbox only supports javascript. Please configure the remote code runner for ${language}.`,
      };
    }

    const results: TestCaseResult[] = [];
    let totalTime = 0;
    let passed = 0;

    for (const tc of testCases) {
      const started = Date.now();
      try {
        const { stdout, error } = runJavaScriptInSandbox(code, tc.input);
        const timeMs = Date.now() - started;
        totalTime += timeMs;
        const output = stdout.trim();
        const isPassed = output === tc.expectedOutput.trim();
        if (isPassed) passed += 1;
        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          output,
          passed: isPassed,
          timeMs,
          error,
        });
      } catch (err) {
        const timeMs = Date.now() - started;
        totalTime += timeMs;
        results.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          output: "",
          passed: false,
          timeMs,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const status: ExecutionResult["status"] =
      passed === testCases.length
        ? "PASSED"
        : passed === 0
          ? "FAILED"
          : "PARTIAL";
    const score = testCases.length
      ? Math.round((passed / testCases.length) * 100)
      : 0;

    return {
      status,
      score,
      passedCount: passed,
      totalCount: testCases.length,
      testResults: results,
      executionTime: totalTime,
      memoryUsed: 0,
      message: `${passed}/${testCases.length} test cases passed`,
    };
  }
}

interface SandboxOutput {
  stdout: string;
  error?: string;
}

const runJavaScriptInSandbox = (code: string, input: string): SandboxOutput => {
  const maxOutputChars = 50000;
  let stdout = "";
  const blockedGlobals: Record<string, boolean> = {
    require: true,
    process: true,
    global: true,
  };

  const sandbox: Record<string, unknown> = {
    console: {
      log: (...args: unknown[]) => {
        stdout += `${args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ")}\n`;
        if (stdout.length > maxOutputChars) {
          throw new Error("Output limit exceeded");
        }
      },
      error: (...args: unknown[]) => {
        stdout += `${args.join(" ")}\n`;
      },
    },
    input,
    gets: (() => {
      const lines = input.split("\n");
      let index = 0;
      return () => (index < lines.length ? lines[index++] ?? "" : "");
    })(),
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Math,
    Number,
    String,
    Array,
    Object,
    Boolean,
    Date,
    JSON,
    RegExp,
    Error,
    TypeError,
    RangeError,
    Symbol,
    BigInt,
  };

  for (const key of Object.keys(blockedGlobals)) {
    Object.defineProperty(sandbox, key, {
      get: () => {
        throw new Error(`Access to '${key}' is disabled in the sandbox`);
      },
    });
  }

  const context = vm.createContext(sandbox, { name: "cmp-sandbox" });
  // Skip any shebang and strip import/export syntax that the sandbox cannot parse.
  const transpiled = code
    .replace(/^#!.*/, "")
    .replace(/^import.*$/gm, "")
    .replace(/^export /gm, "");

  const script = new vm.Script(transpiled);
  try {
    script.runInContext(context, { timeout: 2000, breakOnSigint: true });
  } catch (err) {
    return { stdout, error: err instanceof Error ? err.message : String(err) };
  }
  return { stdout };
};

let runner: CodeRunner;
if (config.code_runner_url) {
  runner = new RemoteSandboxRunner();
} else if (config.allow_local_sandbox) {
  runner = new LocalSandboxRunner();
} else {
  runner = new RemoteSandboxRunner(); // will fail loudly without a URL
}

export const codeRunner: CodeRunner = runner;