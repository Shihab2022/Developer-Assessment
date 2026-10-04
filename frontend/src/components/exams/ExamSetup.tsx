"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Gauge,
  Layers,
  ListChecks,
  Play,
  Search,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Select";
import { Input, Label } from "@/components/ui/Input";
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import { ExamInstructions } from "@/components/exams/ExamInstructions";
import { DIFFICULTIES, DIFFICULTY_LABELS } from "@/lib/constants";
import { useExamsStore } from "@/store/exams";
import { createSeed, createExamPlan } from "@/lib/question-banks/sample";
import {
  describeDuration,
  estimatedSecondsForPaper,
  secondsForDifficulty,
} from "@/lib/question-banks/timing";
import type { QuestionBank, TechnologyId, TechnologyMeta } from "@/lib/question-banks/types";
import { cn } from "@/lib/utils";

const COUNT_OPTIONS = [5, 10, 15, 20, 25];
const PASS_PERCENT = 60;

interface TopicOption {
  topic: string;
  count: number;
}

/**
 * Setup screen shown before an exam starts.
 *
 * The exam length, difficulty and optional topic focus all feed a *computed*
 * clock: each question carries its own allowance (40s easy / 50s medium /
 * 60s hard) and the exam duration is the sum for the questions that will be
 * drawn. Starting an exam first opens a full instruction pop-up, so nobody
 * begins a paper without seeing the rules.
 */
export function ExamSetup({
  meta,
  bank,
  activeAttemptId,
  activeAttemptStartedAt,
  onStart,
}: {
  meta: TechnologyMeta;
  bank: QuestionBank;
  activeAttemptId?: string;
  activeAttemptStartedAt?: string;
  onStart: (attemptId: string) => void;
}) {
  const startAttempt = useExamsStore((state) => state.start);

  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<string>("ALL");
  const [topics, setTopics] = useState<string[]>([]);
  const [topicSearch, setTopicSearch] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Topics that actually exist in the current difficulty slice — this is what
  // keeps the "Topic focus" list honest (you can only focus on what's here).
  const topicOptions = useMemo<TopicOption[]>(() => {
    const counts = new Map<string, number>();
    for (const question of bank.questions) {
      if (difficulty !== "ALL" && question.difficulty !== difficulty) continue;
      counts.set(question.topic, (counts.get(question.topic) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([topic, topicCount]) => ({ topic, count: topicCount }))
      .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
  }, [bank, difficulty]);

  const visibleTopics = useMemo(() => {
    const needle = topicSearch.trim().toLowerCase();
    if (!needle) return topicOptions;
    return topicOptions.filter((option) => option.topic.toLowerCase().includes(needle));
  }, [topicOptions, topicSearch]);

  // Drop any selected topic that no longer exists for the chosen difficulty.
  const selectedTopics = useMemo(
    () => topics.filter((topic) => topicOptions.some((option) => option.topic === topic)),
    [topics, topicOptions],
  );

  const availableInFilter = useMemo(
    () =>
      bank.questions.filter((question) => {
        if (difficulty !== "ALL" && question.difficulty !== difficulty) return false;
        if (selectedTopics.length > 0 && !selectedTopics.includes(question.topic)) return false;
        return true;
      }).length,
    [bank, difficulty, selectedTopics],
  );

  const drawCount = Math.max(1, Math.min(count, availableInFilter || count));

  const estimatedSeconds = useMemo(
    () => estimatedSecondsForPaper(bank, { count, difficulty, topics: selectedTopics }),
    [bank, count, difficulty, selectedTopics],
  );

  const perQuestionSeconds = useMemo(
    () => secondsForDifficulty(difficulty === "ALL" ? undefined : difficulty),
    [difficulty],
  );

  const toggleTopic = (topic: string) =>
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
    );

  const handleReview = () => {
    setError(null);
    if (availableInFilter === 0) {
      setError("No questions match this combination — try a different difficulty or topic.");
      return;
    }
    setShowInstructions(true);
  };

  const handleConfirmStart = () => {
    setError(null);
    const seed = createSeed();
    const plan = createExamPlan(bank, {
      count,
      difficulty,
      topics: selectedTopics,
      shuffleOptions: true,
      seed,
    });
    if (plan.questionIds.length === 0) {
      setError("No questions match this combination — try a different difficulty or topic.");
      setShowInstructions(false);
      return;
    }

    const drawnQuestions = bank.questions.filter((question) =>
      plan.questionIds.includes(question.id),
    );
    const durationSeconds =
      drawnQuestions.reduce((sum, question) => sum + secondsForDifficulty(question.difficulty), 0) ||
      estimatedSeconds;

    const attempt = startAttempt({
      technology: meta.id as TechnologyId,
      technologyLabel: meta.label,
      config: {
        count: plan.questionIds.length,
        durationSeconds: Math.max(60, durationSeconds),
        difficulty,
        topics: selectedTopics,
        shuffleOptions: true,
      },
      plan,
      seed,
    });
    setShowInstructions(false);
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
            <div>
              <p className="text-sm font-medium text-foreground">
                You have an exam in progress for this technology.
              </p>
              {activeAttemptStartedAt && (
                <p className="text-xs text-muted-foreground">
                  Started {new Date(activeAttemptStartedAt).toLocaleString()} — pick up where you
                  left off.
                </p>
              )}
            </div>
            <Button asChild size="sm">
              <Link href={`/exams/${meta.id}/attempt/${activeAttemptId}`}>
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
              <Label>Difficulty</Label>
              <SelectField
                value={difficulty}
                onValueChange={setDifficulty}
                options={[
                  { value: "ALL", label: "Mixed (all difficulties)" },
                  ...DIFFICULTIES.map((value) => ({
                    value,
                    label: DIFFICULTY_LABELS[value] ?? value,
                  })),
                ]}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="exam-topic-search" className="mb-0">
                Topic focus (optional)
              </Label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTopics(topicOptions.map((option) => option.topic))}
                  className="font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  Select all
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setTopics([])}
                  className="font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="exam-topic-search"
                value={topicSearch}
                onChange={(event) => setTopicSearch(event.target.value)}
                placeholder={`Search ${topicOptions.length} available topics…`}
                className="pl-9"
              />
              {topicSearch && (
                <button
                  type="button"
                  onClick={() => setTopicSearch("")}
                  aria-label="Clear topic search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="thin-scrollbar flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-input bg-card p-2.5">
              {visibleTopics.length === 0 ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  No topics match “{topicSearch}” for this difficulty.
                </p>
              ) : (
                visibleTopics.map(({ topic, count: topicCount }) => {
                  const selected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors",
                        selected
                          ? "bg-primary-600 text-white ring-primary-600"
                          : "bg-muted text-muted-foreground ring-transparent hover:text-foreground",
                      )}
                    >
                      {selected && <Check className="size-3" />}
                      {topic}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[10px]",
                          selected ? "bg-white/20" : "bg-background/70",
                        )}
                      >
                        {topicCount}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Leave empty to draw from every topic in this bank.
            </p>
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
              {describeDuration(estimatedSeconds, drawCount)}
            </Badge>
            <span>Questions and options are randomised for every attempt.</span>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button className="w-full" size="lg" onClick={handleReview}>
            <Play />
            Start exam
          </Button>
        </CardBody>
      </Card>

      <Modal open={showInstructions} onOpenChange={setShowInstructions}>
        <ModalContent size="lg" className="max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Before you start: {meta.label} exam</ModalTitle>
          </ModalHeader>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Questions" value={String(drawCount)} icon={ListChecks} />
            <SummaryTile
              label="Time limit"
              value={`${Math.max(1, Math.round(estimatedSeconds / 60))} min`}
              icon={Timer}
            />
            <SummaryTile label="Per question" value={`~${perQuestionSeconds}s`} icon={Clock3} />
            <SummaryTile
              label="Difficulty"
              value={difficulty === "ALL" ? "Mixed" : DIFFICULTY_LABELS[difficulty] ?? difficulty}
              icon={Gauge}
            />
          </div>

          <ExamInstructions
            label={meta.label}
            questionCount={drawCount}
            durationSeconds={estimatedSeconds}
            perQuestionSeconds={perQuestionSeconds}
            passPercent={PASS_PERCENT}
          />

          {selectedTopics.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Topics: {selectedTopics.slice(0, 6).join(", ")}
              {selectedTopics.length > 6 ? ` +${selectedTopics.length - 6} more` : ""}
            </p>
          )}

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <ModalFooter>
            <Button variant="outline" onClick={() => setShowInstructions(false)}>
              Back
            </Button>
            <Button variant="primary" onClick={handleConfirmStart}>
              <Play />
              Start now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

export default ExamSetup;

