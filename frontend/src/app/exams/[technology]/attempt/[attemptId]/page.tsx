"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ExamShell } from "@/components/exams/ExamShell";
import ExamPlayer from "@/components/exams/ExamPlayer";
import { buildPaper } from "@/lib/question-banks/sample";
import { loadBank } from "@/lib/question-banks/load";
import { useExamsStore, attemptById, useExamsHydrated } from "@/store/exams";
import type { ExamAttempt } from "@/store/exams";
import type { QuestionBank, TechnologyId } from "@/lib/question-banks/types";
import type { PaperQuestion } from "@/lib/question-banks/sample";

interface AttemptPageProps {
  params: { technology: string; attemptId: string };
}

/**
 * Renders the live exam player. Resolves the bank + attempt client-side,
 * reconstructs the paper from the stored seed/order, and hands it to
 * `<ExamPlayer>`.
 */
export default function ExamAttemptPage({ params }: AttemptPageProps) {
  const { technology, attemptId } = params;
  const router = useRouter();

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attempts = useExamsStore((state) => state.attempts);
  const attempt = attemptById(attempts, attemptId) as ExamAttempt | undefined;
  const hydrated = useExamsHydrated();

  useEffect(() => {
    if (!hydrated) return;
    if (!attempt) {
      void router.replace(`/exams/${technology}/start`);
      return;
    }
    if (attempt.status !== "IN_PROGRESS") {
      void router.replace(`/exams/${technology}/attempt/${attemptId}/result`);
      return;
    }
    loadBank(technology)
      .then(setBank)
      .catch(() => setError("Failed to load the question bank."));
  }, [hydrated, attempt, attemptId, technology, router]);

  const paper: PaperQuestion[] = useMemo(() => {
    if (!bank || !attempt) return [];
    return buildPaper(bank, {
      questionIds: attempt.questionIds,
      optionOrders: attempt.optionOrders,
    });
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

  if (!bank || !attempt) {
    return (
      <ExamShell>
        <div className="container max-w-2xl py-16 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading exam…</p>
        </div>
      </ExamShell>
    );
  }

  return (
    <ExamPlayer
      technology={technology as TechnologyId}
      attempt={attempt}
      bank={bank}
      paper={paper}
    />
  );
}
