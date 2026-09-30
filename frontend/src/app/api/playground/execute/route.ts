import { NextResponse } from "next/server";
import type { RemoteExecuteOutcome } from "@/lib/playground/types";

/**
 * Same-origin proxy for the remote playground languages (Go and Java).
 *
 * Why this route exists:
 *
 * - The public Piston API (the playground's old default) turned whitelist-only
 *   on 2026-02-15 and answers every request with a 401.
 * - The official Go playground and the public Judge0 instance do not send
 *   `Access-Control-Allow-Origin`, so a browser tab cannot call them directly.
 *
 * Running the calls from the Next.js server sidesteps both problems, lets us
 * set the unique `User-Agent` the Go project asks for, and keeps any future
 * provider (or API key) on the server.
 *
 * Request:  POST { language: "go" | "java", code: string, stdin?: string }
 * Response: 200 → RemoteExecuteOutcome, otherwise { error: string }
 */

/** Official Go playground — form-encoded, free for public use (go.dev/play). */
const GO_PLAYGROUND_URL = "https://go.dev/_/compile?backend=";
/** Public Judge0 CE instance (judge0.com), used for Java. */
const JUDGE0_URL = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";
/** Judge0 language id for Java (verified against the live instance). */
const JUDGE0_JAVA_LANGUAGE_ID = 62;
/** go.dev asks clients to identify themselves with a unique user agent. */
const USER_AGENT = `DevAssess-Playground/1.0 (${
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://github.com/Shihab2022/Developer-Assessment"
})`;

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_CODE_LENGTH = 50_000;
const MAX_STDIN_LENGTH = 10_000;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Runs the snippet on the official Go playground (it has no stdin to feed). */
async function runGo(code: string): Promise<RemoteExecuteOutcome> {
  const body = new URLSearchParams({ body: code, version: "2", withVet: "true" });
  const response = await fetch(GO_PLAYGROUND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": USER_AGENT,
    },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`go.dev answered ${response.status}`);

  const payload = (await response.json()) as {
    Errors?: string;
    VetErrors?: string;
    Events?: Array<{ Kind?: string; Message?: string }>;
  };

  const events = payload.Events ?? [];
  const stdout = events
    .filter((event) => event.Kind === "stdout")
    .map((event) => event.Message ?? "")
    .join("");
  const stderr = events
    .filter((event) => event.Kind === "stderr")
    .map((event) => event.Message ?? "")
    .join("");
  const buildErrors = (payload.Errors ?? "").trim();
  const timedOut = /process took too long/i.test(buildErrors);
  const vetNotes = (payload.VetErrors ?? "").trim();

  return {
    status: timedOut ? "timeout" : buildErrors ? "error" : "success",
    exitCode: buildErrors ? 1 : 0,
    stdout,
    stderr,
    compileOutput: buildErrors,
    message: vetNotes ? `go vet reported:\n${vetNotes}` : null,
    durationMs: 0,
  };
}
/** Compiles and runs the snippet on the public Judge0 instance. */
async function runJava(code: string, stdin: string): Promise<RemoteExecuteOutcome> {
  const response = await fetch(JUDGE0_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({
      language_id: JUDGE0_JAVA_LANGUAGE_ID,
      source_code: code,
      stdin,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Judge0 answered ${response.status}`);

  const payload = (await response.json()) as {
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
    message?: string | null;
    status?: { id?: number; description?: string };
  };

  const description = payload.status?.description ?? "Unknown sandbox status";
  const accepted = payload.status?.id === 3;
  const timedOut = /time limit/i.test(description);
  const compileFailed = /compilation error/i.test(description);

  return {
    status: timedOut ? "timeout" : accepted ? "success" : "error",
    exitCode: accepted ? 0 : 1,
    stdout: payload.stdout ?? "",
    stderr: payload.stderr ?? "",
    compileOutput: compileFailed ? (payload.compile_output ?? "") : "",
    message: accepted ? null : compileFailed ? null : payload.message || description,
    durationMs: 0,
  };
}

export async function POST(request: Request) {
  let payload: { language?: unknown; code?: unknown; stdin?: unknown };
  try {
    payload = await request.json();
  } catch {
    return badRequest("The request body is not valid JSON.");
  }

  const language = payload.language;
  if (language !== "go" && language !== "java") {
    return badRequest("Only Go and Java are executed remotely.");
  }

  const code = typeof payload.code === "string" ? payload.code : "";
  const stdin = typeof payload.stdin === "string" ? payload.stdin : "";

  if (!code.trim()) return badRequest("Write some code before running it.");
  if (code.length > MAX_CODE_LENGTH) {
    return badRequest(`Programs are limited to ${MAX_CODE_LENGTH.toLocaleString()} characters.`);
  }
  if (stdin.length > MAX_STDIN_LENGTH) {
    return badRequest(`Input is limited to ${MAX_STDIN_LENGTH.toLocaleString()} characters.`);
  }

  const label = language === "go" ? "Go" : "Java";
  const sandbox = language === "go" ? "go.dev" : "Judge0";
  const startedAt = Date.now();

  try {
    const outcome = language === "go" ? await runGo(code) : await runJava(code, stdin);
    return NextResponse.json({ ...outcome, durationMs: Date.now() - startedAt });
  } catch (error) {
    const name = (error as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      return NextResponse.json(
        {
          error: `The ${label} sandbox did not answer within ${REQUEST_TIMEOUT_MS / 1000} seconds. It may be busy — try again.`,
        },
        { status: 504 },
      );
    }

    console.error(`[playground] ${label} sandbox unreachable:`, error);
    return NextResponse.json(
      {
        error: `The ${sandbox} sandbox is unreachable right now. Try again shortly, or set NEXT_PUBLIC_CODE_RUNNER_URL to your own Piston-compatible runner.`,
      },
      { status: 502 },
    );
  }
}
