"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, Gauge, Layers, ListChecks, Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Select";
import { Input, Label } from "@/components/ui/Input";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/lib/constants";
import { useExamsStore } from "@/store/exams";
import { createSeed, createExamPlan } from "@/lib/question-banks/sample";
import type { QuestionBank, TechnologyId, TechnologyMeta } from "@/lib/question-banks/types";
import { cn } from "@/lib/utils";

const COUNT_OPTIONS = [5, 10, 15, 20, 25];

/** Setup screen shown before an exam starts: length, difficulty, duration. */
export function ExamSetup({
  meta,
  bank,
  activeAttemptId,
  onStart,
}: {
  meta: TechnologyMeta;
  bank: QuestionBank;
  activeAttemptId?: string;
  onStart: (attemptId: string) => void;
}) {
  const startAttempt = useExamsStore((state) => state.start);

  const [count, setCount] = useState(10);
  const [duration, setDuration] = useState(15);
  const [difficulty, setDifficulty] = useState<string>("ALL");
  const [topics, setTopics] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const availableInFilter = bank.questions.filter(
    (question) => difficulty === "ALL" || question.difficulty === difficulty,
  ).length;

  const handleStart = () => {
    setError(null);
    const seed = createSeed();
    const plan = createExamPlan(bank, { count, difficulty, topics, shuffleOptions: true, seed });
    if (plan.questionIds.length === 0) {
      setError("No questions match this combination — try a different difficulty or topic.");
      return;
    }
    const attempt = startAttempt({
      technology: meta.id as TechnologyId,
      technologyLabel: meta.label,
      config: {
        count: plan.questionIds.length,
        durationMinutes: duration,
        difficulty,
        topics,
        shuffleOptions: true,
      },
      plan,
      seed,
    });
    onStart(attempt.id);
  };

  return (
    <div className="container max-w-3xl py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link href="/exams">
          <ArrowLeft />
          All exams
        </Link>
      </Button>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white",
            meta.accent,
          )}
        >
          <Sparkles className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meta.label} exam</h1>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {activeAttemptId && (
        <Card className="mb-6 border-primary-300 bg-primary-50/60 dark:border-primary-800 dark:bg-primary-950/30">
          <CardBody className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm font-medium text-foreground">
              You have an exam in progress for this technology.
            </p>
            <Button asChild size="sm">
              <Link href={`/exams/${meta.id}/attempt?id=${activeAttemptId}`}>
                Resume exam
                <ArrowRight />
              </Link>
            </Button>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Set up your paper"
          subtitle={`${bank.questionCount} questions available in this bank`}
          icon={<ListChecks className="size-4" />}
        />
        <CardBody className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="exam-count">Questions</Label>
              <SelectField
                id="exam-count"
                value={String(count)}
                onValueChange={(value) => setCount(Number(value))}
                options={COUNT_OPTIONS.map((option) => ({
                  value: String(option),
                  label: `${option} questions`,
                }))}
              />
            </div>
            <div>
              <Label htmlFor="exam-duration">Duration (minutes)</Label>
              <Input
                id="exam-duration"
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(event) =>
                  setDuration(Math.max(1, Math.min(120, Number(event.target.value) || 1)))
                }
              />
            </div>
            <div>
              <Label>Difficulty</Label>
              <SelectField
                value={difficulty}
                onValueChange={setDifficulty}
                options={[
                  { value: "ALL", label: "Mixed (all difficulties)" },
                  ...DIFFICULTIES.map((value) => ({ value, label: DIFFICULTY_LABELS[value] ?? value })),
                ]}
              />
            </div>
            <div>
              <Label>Topic focus (optional)</Label>
              <div className="thin-scrollbar flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-input bg-card p-2.5">
                {bank.topics.map((topic) => {
                  const selected = topics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() =>
                        setTopics((current) =>
                          current.includes(topic)
                            ? current.filter((item) => item !== topic)
                            : [...current, topic],
                        )
                      }
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors",
                        selected
                          ? "bg-primary-600 text-white ring-primary-600"
                          : "bg-muted text-muted-foreground ring-transparent hover:text-foreground",
                      )}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
            <Badge tone="blue" size="sm">
              <Layers className="size-3" />
              {availableInFilter} in filter
            </Badge>
            <Badge tone="gray" size="sm">
              <Gauge className="size-3" />
              {difficulty === "ALL" ? "Mixed difficulty" : DIFFICULTY_LABELS[difficulty] ?? difficulty}
            </Badge>
            <Badge tone="gray" size="sm">
              <Clock3 className="size-3" />
              {duration} minutes
            </Badge>
            <span>Questions and options are randomised for every attempt.</span>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button className="w-full" size="lg" onClick={handleStart}>
            <Play />
            Start exam
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}