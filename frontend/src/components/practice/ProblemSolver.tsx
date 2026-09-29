"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader2,
  Play,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Select";
import { RichText } from "@/components/practice/RichText";
import { CodeBlock } from "@/components/practice/CodeBlock";
import { ExampleCard } from "@/components/practice/ExampleCard";
import { HintsPanel } from "@/components/practice/HintsPanel";
import { ProblemPager, type ProblemLink } from "@/components/practice/ProblemPager";
import { TestResults } from "@/components/practice/TestResults";
import { runTests, type RunSummary } from "@/lib/practice/runner";
import { usePracticeHydrated, usePracticeStore, type PracticeLanguage } from "@/store/practice";
import type { PracticeProblem } from "@/lib/practice/types";
import { DIFFICULTY_LABELS, STATUS_TONES } from "@/lib/constants";
import { cn } from "@/lib/utils";


/**
 * Monaco is heavy and uses the AMD loader, so the editor is client-only and
 * lazily imported — the problem description paints immediately.
 */
const CodeEditor = dynamic(() => import("@/components/practice/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading editor…
    </div>
  ),
});

const LANGUAGE_OPTIONS = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python / Wasm" },
];

/** Shown while Python is selected but nothing is running yet. */
const PYTHON_HINT =
  "Python runs on WebAssembly (Pyodide): the first run downloads about 10 MB, then the runtime stays warm in this tab.";

/**
 * Starter code for a language.
 *
 * Company-authored competition questions ship JavaScript/TypeScript stubs only,
 * so the JavaScript stub is the fallback.
 */
function starterFor(problem: PracticeProblem, language: PracticeLanguage): string {
  return problem.starterCode[language] ?? problem.starterCode.javascript;
}

export function ProblemSolver({
  problem,
  previous,
  next,
  position,
  total,
}: {
  problem: PracticeProblem;
  previous?: ProblemLink;
  next?: ProblemLink;
  /** One-based position of this problem in the bank. */
  position?: number;
  /** Size of the bank (used by the pager footer). */
  total?: number;
}) {
  const hydrated = usePracticeHydrated();
  const solvedMap = usePracticeStore((state) => state.solved);
  const drafts = usePracticeStore((state) => state.drafts);
  const languageMap = usePracticeStore((state) => state.language);
  const setDraft = usePracticeStore((state) => state.setDraft);
  const clearDraft = usePracticeStore((state) => state.clearDraft);
  const setStoredLanguage = usePracticeStore((state) => state.setLanguage);
  const recordAttempt = usePracticeStore((state) => state.recordAttempt);

  const [language, setLanguage] = useState<PracticeLanguage>("javascript");
  const [code, setCode] = useState(problem.starterCode.javascript);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [busy, setBusy] = useState<"run" | "submit" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [tab, setTab] = useState<"description" | "hints">("description");
  const [mobilePane, setMobilePane] = useState<"problem" | "code">("problem");

  const solved = Boolean(solvedMap[problem.id]?.solvedAt);
  const attempts = solvedMap[problem.id]?.attempts ?? 0;

  // Restore the saved language + draft once persistence is ready.
  useEffect(() => {
    if (!hydrated) return;
    const savedLanguage = languageMap[problem.id] ?? "javascript";
    const savedDraft = drafts[problem.id]?.[savedLanguage];
    setLanguage(savedLanguage);
    setCode(savedDraft ?? starterFor(problem, savedLanguage));
    setSummary(null);
    // Intentionally keyed on the problem so switching problems resets the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, problem.id]);

  const handleCodeChange = useCallback(
    (next: string) => {
      setCode(next);
      setDraft(problem.id, language, next);
    },
    [language, problem.id, setDraft],
  );

  const handleLanguageChange = useCallback(
    (next: string) => {
      const target = next as PracticeLanguage;
      setDraft(problem.id, language, code);
      setStoredLanguage(problem.id, target);
      setLanguage(target);
      setCode(drafts[problem.id]?.[target] ?? starterFor(problem, target));
      setSummary(null);
    },
    [code, drafts, language, problem, setDraft, setStoredLanguage],
  );

  const handleReset = useCallback(() => {
    setCode(starterFor(problem, language));
    clearDraft(problem.id, language);
    setSummary(null);
  }, [clearDraft, language, problem]);

  const handleRun = useCallback(async () => {
    setBusy("run");
    setSummary(null);
    setStatus(null);
    const result = await runTests({
      code,
      language,
      problem,
      includeHidden: false,
      onStatus: setStatus,
    });
    setSummary(result);
    setStatus(null);
    setBusy(null);
  }, [code, language, problem]);

  const handleSubmit = useCallback(async () => {
    setBusy("submit");
    setSummary(null);
    setStatus(null);
    const result = await runTests({
      code,
      language,
      problem,
      includeHidden: true,
      onStatus: setStatus,
    });
    setSummary(result);
    setStatus(null);
    recordAttempt({
      problemId: problem.id,
      language,
      passed: result.passed,
      total: result.total,
    });
    setBusy(null);

    if (result.total > 0 && result.passed === result.total) {
      toast.success("Accepted — all tests passed");
    } else if (result.timedOut) {
      toast.error("Time limit exceeded");
    } else if (!result.ok) {
      toast.error("Your code did not compile or threw an error");
    } else {
      toast.error(`${result.passed} of ${result.total} tests passed`);
    }
  }, [code, language, problem, recordAttempt]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-2 shrink-0">
              <Link href="/practice">
                <ArrowLeft />
                <span className="hidden sm:inline">Problems</span>
              </Link>
            </Button>
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                {problem.number}.
              </span>
              <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                {problem.title}
              </h1>
              <Badge tone={STATUS_TONES[problem.difficulty] ?? "gray"} size="sm">
                {DIFFICULTY_LABELS[problem.difficulty] ?? problem.difficulty}
              </Badge>
              {solved && (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-label="Solved" />
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {attempts > 0 && (
              <span className="hidden text-xs text-muted-foreground md:inline">
                {attempts} {attempts === 1 ? "attempt" : "attempts"}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={!previous}
              title={previous ? `Previous: ${previous.title}` : "This is the first problem"}
              asChild={Boolean(previous)}
            >
              {previous ? (
                <Link href={`/practice/${previous.id}`} aria-label={`Previous: ${previous.title}`}>
                  <ChevronLeft />
                  <span className="hidden sm:inline">Prev</span>
                </Link>
              ) : (
                <span aria-disabled="true">
                  <ChevronLeft />
                  <span className="hidden sm:inline">Prev</span>
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!next}
              title={next ? `Next: ${next.title}` : "This is the last problem"}
              asChild={Boolean(next)}
            >
              {next ? (
                <Link href={`/practice/${next.id}`} aria-label={`Next: ${next.title}`}>
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight />
                </Link>
              ) : (
                <span aria-disabled="true">
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile pane switcher */}
      <div className="flex shrink-0 border-b border-border bg-card lg:hidden">
        {(["problem", "code"] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            onClick={() => setMobilePane(pane)}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              mobilePane === pane
                ? "border-b-2 border-primary-600 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {pane === "problem" ? "Problem" : "Code"}
          </button>
        ))}
      </div>

      {/* Split view: problem | code */}
      <div className="grid min-h-0 flex-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-2 lg:p-5 xl:gap-5 xl:p-6">
        {/* Left: description + hints, with the pager pinned to the bottom */}
        <section
          className={cn(
            "min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:flex",
            mobilePane === "problem" ? "flex" : "hidden",
          )}
        >
          <div
            className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-3"
            role="tablist"
            aria-label="Problem details"
          >
            {(
              [
                { id: "description", label: "Description", icon: BookOpen },
                { id: "hints", label: "Hints", icon: Lightbulb },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    tab === item.id
                      ? "border-primary-600 text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                  {item.id === "hints" && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {problem.hints.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
            {tab === "description" ? (
              <div className="space-y-7">
                <RichText
                  text={problem.description}
                  className="text-[13.5px] leading-7 text-slate-600 dark:text-slate-300"
                />

                <div className="space-y-4">
                  {problem.examples.map((example, index) => (
                    <ExampleCard
                      key={index}
                      example={example}
                      index={index}
                      functionName={problem.functionName}
                    />
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <CodeBlock
                    code={problem.constraints.join("\n")}
                    label="Constraints"
                    copyable={false}
                  />

                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Topics
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {problem.topics.map((topic) => (
                        <Badge key={topic} tone="indigo" size="sm">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                      Implement{" "}
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                        {problem.functionName}
                      </code>{" "}
                      in the editor and return the answer — printing it is never graded.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <HintsPanel key={problem.id} problem={problem} />
            )}
          </div>

          <ProblemPager
            previous={previous}
            next={next}
            position={position}
            total={total}
            className="shrink-0 border-t border-border bg-muted/20 px-3 py-3 sm:px-4"
          />
        </section>

        {/* Right: editor + results */}
        <section
          className={cn(
            "min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:flex",
            mobilePane === "code" ? "flex" : "hidden",
          )}
        >
          {/* Toolbar: language + Run + Submit */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-3 py-2">
            <SelectField
              value={language}
              onValueChange={handleLanguageChange}
              options={LANGUAGE_OPTIONS}
              className="w-36"
              id="practice-language"
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                loading={busy === "run"}
                disabled={busy !== null}
              >
                <Play />
                Run
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                loading={busy === "submit"}
                disabled={busy !== null}
              >
                <Send />
                Submit
              </Button>
            </div>
          </div>

          {/* Runtime hint / progress (Python boots WebAssembly) */}
          {(status || language === "python") && (
            <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
              {status && <Loader2 className="size-3 shrink-0 animate-spin" />}
              <span className="truncate">{status ?? PYTHON_HINT}</span>
            </div>
          )}

          {/* Editor */}
          <div className="min-h-[200px] flex-1">
            <CodeEditor
              value={code}
              language={language}
              onChange={handleCodeChange}
              onReset={handleReset}
              onRun={busy ? undefined : handleRun}
              onSubmit={busy ? undefined : handleSubmit}
              className="h-full"
            />
          </div>

          {/* Results */}
          {summary && (
            <div className="flex max-h-[45%] min-h-0 shrink-0 flex-col border-t border-border">
              <TestResults summary={summary} problem={problem} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}