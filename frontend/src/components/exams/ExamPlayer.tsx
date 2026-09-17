"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Flag, Send, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { QuestionContent } from "@/components/exams/QuestionContent";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useExamsStore } from "@/store/exams";
import type { QuestionBank, TechnologyId } from "@/lib/question-banks/types";
import { type PaperQuestion } from "@/lib/question-banks/sample";
import type { ExamAttempt } from "@/store/exams";
import { cn } from "@/lib/utils";
import { DIFFICULTY_LABELS } from "@/lib/constants";

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-green-600",
  MEDIUM: "text-amber-600",
  HARD: "text-red-600",
};

/** Inline text renderer that handles backtick code spans. */
function InlineText({ value }: { value: string }) {
  const parts = value.split(/`([^`]+)`/g);
  return (
    <span className="block text-sm text-foreground">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
            {part}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

/** Renders a single MCQ question with its radio options. */
function QuestionCard({
  paperQuestion,
  optionOrder,
  selectedValue,
  onSelect,
  flagged,
  onFlag,
}: {
  paperQuestion: PaperQuestion;
  optionOrder: string[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  flagged: boolean;
  onFlag: () => void;
}) {
  const { question } = paperQuestion;
  const difficultyColor = DIFFICULTY_COLORS[question.difficulty] ?? "text-muted-foreground";
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="gray" size="sm">
              {question.topic}
            </Badge>
            <Badge tone="gray" size="sm">
              Level {question.level}
            </Badge>
            <span className={`text-xs font-medium ${difficultyColor}`}>
              ({DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty})
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">{question.title}</h2>
        </div>
        <Button
          variant={flagged ? "subtle" : "ghost"}
          size="sm"
          onClick={onFlag}
          aria-pressed={flagged}
          className={cn(
            "shrink-0",
            flagged &&
              "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800",
          )}
        >
          <Flag className="size-4" />
          <span className="hidden sm:ml-1 sm:inline">{flagged ? "Flagged" : "Flag"}</span>
        </Button>
      </div>

      {/* Question body */}
      <QuestionContent blocks={question.content} />

      {/* Options */}
      <RadioGroup value={selectedValue ?? ""} onValueChange={onSelect}>
        {optionOrder.map((optionId, index) => {
          const option = question.options.find((o) => o.id === optionId);
          if (!option) return null;
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3.5 transition-colors hover:bg-muted"
            >
              <RadioGroupItem value={option.id} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  {option.code ? (
                    <pre className="thin-scrollbar overflow-x-auto rounded-md bg-slate-950 px-3 py-2 font-mono text-[12px] text-emerald-100">
                      {option.code}
                    </pre>
                  ) : (
                    <InlineText value={option.text} />
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

/**
 * Main exam player. Reads the persisted attempt, resolves the paper from the
 * bank, tracks the countdown, and submits on time-out or explicit request.
 */
export default function ExamPlayer({
  technology,
  attempt,
  bank,
  paper,
}: {
  technology: TechnologyId;
  attempt: ExamAttempt;
  bank: QuestionBank;
  paper: PaperQuestion[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const saveAnswer = useExamsStore((state) => state.saveAnswer);
  const toggleFlag = useExamsStore((state) => state.toggleFlag);
  const submitAttempt = useExamsStore((state) => state.submit);

  const total = paper.length;
  const answeredCount = useMemo(
    () => attempt.questionIds.filter((id) => attempt.answers[id] && attempt.answers[id] !== "SKIP").length,
    [attempt],
  );
  const flaggedCount = attempt.flagged.length;

  const { label: clock } = useExamTimer(attempt.expiresAt, () => {
    submitAttempt(attempt.id, "EXPIRED");
    void router.replace(`/exams/${technology}/attempt/${attempt.id}/result`);
  });

  const selectedValue = attempt.answers[paper[current]?.question?.id ?? ""] ?? undefined;
  const onNext = () => setCurrent((c) => Math.min(c + 1, total - 1));
  const onPrev = () => setCurrent((c) => Math.max(c - 1, 0));

  const handleSubmit = () => {
    setShowConfirm(false);
    setSubmitting(true);
    submitAttempt(attempt.id, "SUBMITTED");
    void router.replace(`/exams/${technology}/attempt/${attempt.id}/result`);
  };

  useEffect(() => {
    if (attempt.status !== "IN_PROGRESS") {
      void router.replace(`/exams/${technology}/attempt/${attempt.id}/result`);
    }
    }, [attempt.status, attempt.id, router, technology]);

  return (
    <>
      {/* Top bar: timer + progress */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-14 items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/exams/${technology}/start`)}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Exit
          </button>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 font-mono font-medium text-foreground">
              <Clock className="size-4 text-muted-foreground" />
              <span
                className={cn(
                  "transition-colors",
                  parseInt((clock.split(":")[0] ?? "0"), 10) < 2
                    ? "text-red-500"
                    : "text-foreground",
                )}
              >
                {clock}
              </span>
            </div>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {answeredCount}/{total} answered
            </span>
            {flaggedCount > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Flag className="size-3 text-amber-500" />
                  {flaggedCount} flagged
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="container py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Question {current + 1} of {total}
            </span>
            <button
              type="button"
              onClick={() => {
                const questionId = paper[current]?.question?.id;
                if (questionId) {
                  if (attempt.flagged.includes(questionId)) toggleFlag(attempt.id, questionId);
                  saveAnswer(attempt.id, questionId, "SKIP");
                }
                if (current < total - 1) onNext();
              }}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <SkipForward className="size-4" />
              Skip
            </button>
          </div>

          {paper[current] && (
            <QuestionCard
              paperQuestion={paper[current]}
              optionOrder={paper[current].optionOrder}
              selectedValue={selectedValue}
              onSelect={(value) => saveAnswer(attempt.id, paper[current].question.id, value)}
              flagged={attempt.flagged.includes(paper[current].question.id)}
              onFlag={() => toggleFlag(attempt.id, paper[current].question.id)}
            />
          )}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onPrev}
              disabled={current === 0}
              className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <ArrowLeft className="size-4" />
              Previous
            </button>
            <div className="flex gap-2">
              {current < total - 1 && (
                <button
                  type="button"
                  onClick={onNext}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Next
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-50"
              >
                <Send className="size-4" />
                {submitting ? "Submitting…" : "Submit exam"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Modal open={showConfirm} onOpenChange={setShowConfirm}>
        <ModalContent size="sm">
          <ModalHeader>
            <ModalTitle>Submit exam?</ModalTitle>
          </ModalHeader>
          <p className="text-sm text-muted-foreground">
            You've answered {answeredCount} of {total} questions. Once you submit,
            you cannot change your answers.
          </p>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
