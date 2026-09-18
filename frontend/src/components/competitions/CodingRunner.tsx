"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Play } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Select";
import { formatValue } from "@/lib/practice/compare";
import { runTests, type RunSummary } from "@/lib/practice/runner";
import type { PracticeProblem } from "@/lib/practice/types";

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

/**
 * Embedded coding runner for a competition coding row (requirement 5 —
 * company questions grade exactly like library coding problems).
 *
 * Runs the visible sample cases in the browser worker; the host's hidden
 * suite stays hidden and is only executed at submit time via the same runner.
 * Reports `passed/total` upward so scoring stays proportional.
 */
export function CodingRunner({
  problem,
  starter,
  initialCode,
  onProgress,
}: {
  problem: PracticeProblem;
  starter: { javascript: string; typescript: string };
  initialCode?: string;
  onProgress: (code: string, passed: number, total: number) => void;
}) {
  const [language, setLanguage] = useState<"javascript" | "typescript">("javascript");
  const [code, setCode] = useState(initialCode ?? starter.javascript);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCode(initialCode ?? starter[language]);
    setSummary(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const visibleTotal = problem.testCases.filter((testCase) => !testCase.isHidden).length;

  const handleRun = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await runTests({
        code,
        language,
        problem,
        includeHidden: false,
      });
      setSummary(outcome);
      onProgress(code, outcome.passed, problem.testCases.length);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <SelectField
          value={language}
          onValueChange={(value) => setLanguage(value as "javascript" | "typescript")}
          options={LANGUAGE_OPTIONS}
          className="w-36"
        />
        <div className="flex items-center gap-2">
          {summary && (
            <Badge tone={summary.passed === visibleTotal ? "green" : "amber"} size="sm">
              {summary.passed}/{visibleTotal} visible passed
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleRun} loading={busy}>
            <Play className="size-4" />
            Run samples
          </Button>
        </div>
      </div>
      <div className="h-56">
        <CodeEditor
          value={code}
          language={language}
          onChange={(next) => {
            setCode(next);
            onProgress(next, summary?.passed ?? 0, problem.testCases.length);
          }}
          onReset={() => {
            setCode(starter[language]);
            setSummary(null);
          }}
          onRun={handleRun}
          className="h-full"
        />
      </div>
      {summary && (
        <div className="border-t border-border px-3 py-2">
          {summary.error ? (
            <p className="font-mono text-xs text-destructive">{summary.error}</p>
          ) : (
            <ul className="space-y-1">
              {summary.results.map((result) => (
                <li key={result.index} className="font-mono text-xs text-muted-foreground">
                  <span className={result.passed ? "text-emerald-600" : "text-rose-600"}>
                    {result.passed ? "✓" : "✗"} case {result.index + 1}
                  </span>{" "}
                  {result.actualText !== undefined && (
                    <span className="text-foreground">→ {formatValue(result.actualText, 60)}</span>
                  )}
                  {result.error && <span className="text-destructive"> {result.error}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default CodingRunner;

