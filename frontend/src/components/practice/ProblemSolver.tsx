"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Select";
import { RichText } from "@/components/practice/RichText";
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
];

export function ProblemSolver({
  problem,
  previousId,
  nextId,
}: {
  problem: PracticeProblem;
  previousId?: string;
  nextId?: string;
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
  const [tab, setTab] = useState<"description" | "hints">("description");
  const [mobilePane, setMobilePane] = useState<"problem" | "code">("problem");
  const [revealedHints, setRevealedHints] = useState(0);

  const solved = Boolean(solvedMap[problem.id]?.solvedAt);
  const attempts = solvedMap[problem.id]?.attempts ?? 0;
  const visibleCases = useMemo(
    () => problem.testCases.filter((testCase) => !testCase.isHidden).length,
    [problem],
  );

  // Restore the saved language + draft once persistence is ready.
  useEffect(() => {
    if (!hydrated) return;
    const savedLanguage = languageMap[problem.id] ?? "javascript";
    const savedDraft = drafts[problem.id]?.[savedLanguage];
    setLanguage(savedLanguage);
    setCode(savedDraft ?? problem.starterCode[savedLanguage]);
    setSummary(null);
    setRevealedHints(0);
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
      setCode(drafts[problem.id]?.[target] ?? problem.starterCode[target]);
      setSummary(null);
    },
    [code, drafts, language, problem.id, problem.starterCode, setDraft, setStoredLanguage],
  );

  const handleReset = useCallback(() => {
    setCode(problem.starterCode[language]);
    clearDraft(problem.id, language);
    setSummary(null);
  }, [clearDraft, language, problem.id, problem.starterCode]);

  const handleRun = useCallback(async () => {
    setBusy("run");
    setSummary(null);
    const result = await runTests({ code, language, problem, includeHidden: false });
    setSummary(result);
    setBusy(null);
  }, [code, language, problem]);

  const handleSubmit = useCallback(async () => {
    setBusy("submit");
    setSummary(null);
    const result = await runTests({ code, language, problem, includeHidden: true });
    setSummary(result);
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
      <div className="border-b border-border bg-card">
        <div className="container flex h-14 items-center justify-between gap-3">
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

          <div className="flex shrink-0 items-center gap-1">
            {attempts > 0 && (
              <span className="hidden text-xs text-muted-foreground md:inline">
                {attempts} {attempts === 1 ? "attempt" : "attempts"}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              asChild={Boolean(previousId)}
              disabled={!previousId}
              title="Previous problem"
            >
              {previousId ? (
                <Link href={`/practice/${previousId}`}>
                  <ChevronLeft />
                </Link>
              ) : (
                <span>
                  <ChevronLeft />
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild={Boolean(nextId)}
              disabled={!nextId}
              title="Next problem"
            >
              {nextId ? (
                <Link href={`/practice/${nextId}`}>
                  <ChevronRight />
                </Link>
              ) : (
                <span>
                  <ChevronRight />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile pane switcher */}
      <div className="flex border-b border-border bg-card lg:hidden">
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
      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        {/* Left: description */}
        <div
          className={cn(
            "thin-scrollbar min-h-0 overflow-y-auto border-border lg:block lg:border-r",
            mobilePane === "problem" ? "block" : "hidden",
          )}
        >
          <div className="container max-w-none px-5 py-6 lg:px-6">
            <div className="mb-5 flex items-center gap-1 border-b border-border">
              {(
                [
                  { id: "description", label: "Description", icon: BookOpen },
                  { id: "hints", label: `Hints (${problem.hints.length})`, icon: Lightbulb },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                      tab === item.id
                        ? "border-primary-600 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {tab === "description" ? (
              <div className="space-y-6">
                <RichText text={problem.description} />

                <div className="space-y-3">
                  {problem.examples.map((example, index) => (
                    <div key={index}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Example {index + 1}
                      </p>
                      <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-[12px] leading-relaxed">
                        <div>
                          <span className="text-muted-foreground">Input: </span>
                          <span className="text-foreground">{example.input}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Output: </span>
                          <span className="text-foreground">{example.output}</span>
                        </div>
                        {example.explanation && (
                          <div className="text-muted-foreground">
                            <span>Explanation: </span>
                            {example.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Constraints
                  </p>
                  <ul className="space-y-1 font-mono text-[12px] text-muted-foreground">
                    {problem.constraints.map((constraint) => (
                      <li key={constraint} className="flex gap-2">
                        <span className="select-none">•</span>
                        <span>{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Topics
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.topics.map((topic) => (
                      <Badge key={topic} tone="gray" size="sm">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {problem.hints.slice(0, revealedHints).map((hint, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20"
                  >
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                      Hint {index + 1}
                    </p>
                    <RichText text={hint} className="text-amber-900 dark:text-amber-100" />
                  </div>
                ))}

                {revealedHints < problem.hints.length ? (
                  <Button variant="outline" onClick={() => setRevealedHints((count) => count + 1)}>
                    <Lightbulb />
                    Reveal hint {revealedHints + 1}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    That is every hint for this problem.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: editor + results */}
        <div
          className={cn(
            "flex min-h-0 flex-col bg-card",
            mobilePane === "code" ? "flex" : "hidden lg:flex",
          )}
        >
          {/* Toolbar: language + Run + Submit */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
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

          {/* Editor */}
          <div className="min-h-[180px] flex-1">
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
            <div className="flex max-h-[42%] min-h-0 shrink-0 flex-col border-t border-border">
              <TestResults summary={summary} problem={problem} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}