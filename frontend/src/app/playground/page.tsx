import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, ShieldCheck, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ExamShell } from "@/components/exams/ExamShell";
import { PlaygroundWorkspace } from "@/components/playground/PlaygroundWorkspace";
import { PLAYGROUND_LANGUAGES } from "@/lib/playground/languages";
import {
  PYTHON_LOAD_TIMEOUT_MS,
  PYTHON_RUN_TIMEOUT_MS,
  SCRIPT_TIMEOUT_MS,
} from "@/lib/playground/limits";
import type { PlaygroundRuntime } from "@/lib/playground/types";

export const metadata: Metadata = {
  title: "Online compiler — DevAssess",
  description:
    "Write and run JavaScript, TypeScript, Python, HTML and CSS in the browser: sandboxed execution, live output and an instant preview — no sign-in required.",
};

/** Runtime badge copy, keyed by how a language produces output. */
const RUNTIME_LABELS: Record<PlaygroundRuntime, { label: string; tone: "blue" | "violet" }> = {
  script: { label: "Web Worker", tone: "blue" },
  python: { label: "Python / Wasm", tone: "blue" },
  preview: { label: "Live preview", tone: "violet" },
};

export default function PlaygroundPage() {
  return (
    <ExamShell>
      <div className="container max-w-6xl py-14">
        <SectionHeading
          eyebrow="Online compiler"
          title="Write code, run it, watch the output"
          description="JavaScript, TypeScript and Python execute in a sandboxed worker; HTML and CSS render in a live preview that streams its console back to you. Your snippet is never uploaded — it runs in this tab."
        />

        <PlaygroundWorkspace />

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Terminal className="size-4 text-primary-600" />
              Two runtimes, one editor
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Script languages print into the console panel below the editor, while HTML and CSS
              render into a preview pane and forward their logs to the same panel.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary-600" />
              Sandboxed and time-boxed
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {SCRIPT_TIMEOUT_MS / 1000} seconds per JavaScript or TypeScript run and{" "}
              {PYTHON_RUN_TIMEOUT_MS / 1000} seconds per warm Python run. On timeout the worker is
              terminated, so the page never freezes.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Cpu className="size-4 text-primary-600" />
              Python without a server
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              CPython is compiled to WebAssembly and cached by the browser. The first run may take
              up to {PYTHON_LOAD_TIMEOUT_MS / 1000} seconds to download the runtime; later runs
              start instantly.
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