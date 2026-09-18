import type { Metadata } from "next";
import Link from "next/link";
import { Code2, Library, Play, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ExamShell } from "@/components/exams/ExamShell";
import { ProblemTable } from "@/components/practice/ProblemTable";
import { ALL_PROBLEMS, ALL_TOPICS, DIFFICULTY_COUNTS, PROBLEM_COUNT, TOTAL_TEST_CASES } from "@/lib/practice/index";
import { STATUS_TONES, DIFFICULTY_LABELS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Practice arena — DevAssess",
  description:
    "Solve coding problems in your browser: JavaScript and TypeScript solutions run against real test cases with instant feedback.",
};

export default function PracticeIndexPage() {
  const index = ALL_PROBLEMS.map((problem) => ({
    id: problem.id,
    number: problem.number,
    title: problem.title,
    difficulty: problem.difficulty,
    topics: problem.topics,
  }));

  return (
    <ExamShell>
      <div className="container max-w-5xl py-14">
        <SectionHeading
          eyebrow="Practice arena"
          title="Solve real problems in your browser"
          description={`${index.length} problems with ${formatNumber(TOTAL_TEST_CASES)} test cases. Write a solution, run the visible tests, then submit against the hidden suite.`}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Library className="size-4 text-primary-600" />
              Problem bank
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{PROBLEM_COUNT}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(DIFFICULTY_COUNTS) as (keyof typeof DIFFICULTY_COUNTS)[]).map((level) => (
                <Badge key={level} tone={STATUS_TONES[level] ?? "gray"} size="sm">
                  {DIFFICULTY_LABELS[level] ?? level}: {DIFFICULTY_COUNTS[level]}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Play className="size-4 text-primary-600" />
              Run, then submit
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Run</span> checks the visible examples.
              <span className="font-semibold text-foreground"> Submit </span>
              runs the full suite, hidden cases included, and records your progress.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Terminal className="size-4 text-primary-600" />
              JavaScript & TypeScript
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Solutions execute in a sandboxed worker with a 5-second limit per run.
              Console output is captured for debugging.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Code2 className="size-5 text-primary-600" />
            All problems
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link href="/exams">Prefer timed exams? Try MCQ rounds</Link>
          </Button>
        </div>

        <div className="mt-4">
          <ProblemTable problems={index} topics={ALL_TOPICS} />
        </div>
      </div>
    </ExamShell>
  );
}
