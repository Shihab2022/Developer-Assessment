import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, ShieldCheck, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ExamShell } from "@/components/exams/ExamShell";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";
import { PLAYGROUND_LANGUAGES } from "@/lib/playground/languages";
import {
  PYTHON_RUN_TIMEOUT_MS,
  SCRIPT_TIMEOUT_MS,
  SQL_RUN_TIMEOUT_MS,
} from "@/lib/playground/limits";
import type { PlaygroundRuntime } from "@/lib/playground/types";

export const metadata: Metadata = {
  title: "Online compiler",
  description:
    "Write and run JavaScript, TypeScript, Python, SQL, Go, Java, HTML, CSS, Tailwind and React + MUI in the browser: sandboxed execution, live output, SQL result tables and an instant preview — no sign-in required.",
};

/** Runtime badge copy, keyed by how a language produces output. */
const RUNTIME_LABELS: Record<
  PlaygroundRuntime,
  { label: string; tone: "blue" | "violet" | "amber" | "green" }
> = {
  script: { label: "Web Worker", tone: "blue" },
  python: { label: "Python / Wasm", tone: "blue" },
  sql: { label: "SQLite / Wasm", tone: "green" },
  remote: { label: "Remote sandbox", tone: "amber" },
  preview: { label: "Live preview", tone: "violet" },
};

export default function PlaygroundPage() {
  return (
    <ExamShell>
      <div className="container max-w-6xl py-14">
        <SectionHeading
          eyebrow="Online compiler"
          title="Write code, run it, watch the output"
          description="Ten languages, one workspace: JavaScript, TypeScript and Python run in sandboxed workers, SQL runs on SQLite with real result tables, Go and Java dispatch to a remote sandbox, and HTML, CSS, Tailwind and React + MUI render into a live preview that streams its console back to you. Your snippet is never uploaded — it runs in this tab."
        />

        <PlaygroundWorkspace />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Terminal className="size-4 text-primary-600" />
              Input, output, preview
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The Input tab feeds stdin to your program, script languages print into the Output
              panel, and the web languages render into a preview pane that forwards its logs to the
              same panel.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary-600" />
              Sandboxed and time-boxed
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {SCRIPT_TIMEOUT_MS / 1000} seconds per JavaScript or TypeScript run,{" "}
              {PYTHON_RUN_TIMEOUT_MS / 1000} seconds per warm Python run and{" "}
              {SQL_RUN_TIMEOUT_MS / 1000} seconds per query. On a timeout the worker is terminated,
              so the page never freezes — and every web tab renders inside a sandboxed iframe.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Cpu className="size-4 text-primary-600" />
              Real runtimes, no install
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              CPython, SQLite and the Tailwind compiler all run as WebAssembly in this tab — the
              first run downloads the runtime, later runs start instantly. Go and Java are compiled
              on a remote sandbox, because a browser cannot run those toolchains itself.
            </p>
          </div>
        </div>

        <h2 className="mt-12 text-lg font-semibold tracking-tight text-foreground">
          What each tab can do
        </h2>

        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {PLAYGROUND_LANGUAGES.map((language) => {
            const runtime = RUNTIME_LABELS[language.runtime];
            return (
              <li
                key={language.value}
                className="rounded-xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{language.label}</h3>
                  <Badge tone={runtime.tone} size="sm">
                    {runtime.label}
                  </Badge>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {language.fileName}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {language.blurb}
                </p>
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-xs text-muted-foreground">
          Looking for graded work instead? Solve problems in the{" "}
          <Link href="/practice" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            practice arena
          </Link>{" "}
          or sit a timed{" "}
          <Link href="/exams" className="font-medium text-primary-600 hover:underline dark:text-primary-400">
            MCQ exam
          </Link>
          .
        </p>
      </div>
    </ExamShell>
  );
}