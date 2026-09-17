"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, RotateCcw, Loader2, BarChart3 } from "lucide-react";
import { ExamShell } from "@/components/exams/ExamShell";
import { ReviewRow } from "@/components/exams/ReviewRow";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { loadBank } from "@/lib/question-banks/load";
import { useExamsStore, attemptById, gradeAttemptById, useExamsHydrated } from "@/store/exams";
import type { QuestionBank } from "@/lib/question-banks/types";
import type { ExamAttempt } from "@/store/exams";

interface ResultPageProps {
  params: { technology: string; attemptId: string };
}

export default function ExamResultPage({ params }: ResultPageProps) {
  const { technology, attemptId } = params;
  const router = useRouter();

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attempts = useExamsStore((state) => state.attempts);
  const removeAttempt = useExamsStore((state) => state.remove);
  const attempt = attemptById(attempts, attemptId) as ExamAttempt | undefined;
  const hydrated = useExamsHydrated();

  // Only judge the attempt once the persisted store is available.
  useEffect(() => {
    if (!hydrated) return;
    if (attempt && attempt.status === "IN_PROGRESS") {
      void router.replace(`/exams/${technology}/attempt/${attemptId}`);
    }
  }, [hydrated, attempt, attemptId, technology, router]);

  useEffect(() => {
    loadBank(technology)
      .then(setBank)
      .catch(() => setError("Failed to load the question bank."));
  }, [technology]);

  const result = useMemo(() => {
    if (!bank || !attempt) return null;
    return gradeAttemptById(attempt, bank);
  }, [bank, attempt]);

  if (error) {
    return (
      <ExamShell>
        <div className="container max-w-2xl py-16 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </ExamShell>
    );
  }

  // Hydrated but the attempt is gone (cleared storage, different browser, or a
  // stale link) — offer a way back instead of spinning forever.
  if (hydrated && !attempt) {
    return (
      <ExamShell>
        <div className="container max-w-2xl py-20 text-center">
          <h1 className="text-xl font-semibold text-foreground">Attempt not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This attempt is not stored in this browser. Start a new exam to get a fresh paper.
          </p>
          <Button asChild className="mt-6">
            <a href={`/exams/${technology}/start`}>Start a new exam</a>
          </Button>
        </div>
      </ExamShell>
    );
  }

  if (!bank || !attempt || !result) {
    return (
      <ExamShell>
        <div className="container max-w-2xl py-16 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading results…</p>
        </div>
      </ExamShell>
    );
  }

  const passed = result.passed;
  const percentColor = passed ? "text-green-600" : result.percent >= 40 ? "text-amber-600" : "text-red-600";

    return (
    <ExamShell>
      <div className="container max-w-4xl py-12">
        {/* Score summary */}
          <Card className="mb-8">
            <div className="border-b border-border px-5 py-4">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">Exam result</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{attempt.technologyLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  {passed ? (
                    <CheckCircle className="size-6 text-green-500" />
                  ) : (
                    <XCircle className="size-6 text-red-500" />
                  )}
                  <Badge tone={passed ? "green" : "red"} size="sm">
                    {passed ? "PASSED" : "FAILED"}
                  </Badge>
                </div>
              </div>
            </div>
          <CardBody>
            <div className="mb-6 text-center">
              <div className={`text-5xl font-bold ${percentColor}`}>
                {result.percent}%
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.correct} of {result.total} questions correct
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{result.correct}</div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{result.wrong}</div>
                <div className="text-xs text-muted-foreground">Wrong</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{result.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.round((result.answered / result.total) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Attempted</div>
              </div>
            </div>

            {attempt.submittedAt && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>Submitted at {new Date(attempt.submittedAt).toLocaleString()}</span>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Per-question review */}
        <h2 className="mb-4 text-xl font-semibold text-foreground">Question review</h2>
        <div className="space-y-2">
          {result.perQuestion.map((item) => {
            const question = bank.questions.find((q) => q.id === item.questionId);
            if (!question) return null;
            return (
              <ReviewRow
                key={item.questionId}
                question={question}
                chosenId={item.chosenOptionId}
                correctId={item.correctOptionId}
              />
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline">
            <a href="/exams">
              <BarChart3 className="size-4" />
              All exams
            </a>
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              removeAttempt(attempt.id);
              void router.push(`/exams/${technology}/start`);
            }}
          >
            <RotateCcw className="size-4" />
            Retake exam
          </Button>
        </div>
      </div>
    </ExamShell>
  );
}
