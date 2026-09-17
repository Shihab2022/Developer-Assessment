"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ExamSetup } from "@/components/exams/ExamSetup";
import { catalogById, metaFromBank } from "@/lib/question-banks/catalog";
import { loadBank } from "@/lib/question-banks/load";
import { useExamsStore } from "@/store/exams";
import type { QuestionBank, TechnologyId } from "@/lib/question-banks/types";

interface StartProps {
  params: { technology: string };
}

/**
 * Loads the question bank on the client (via dynamic import so only the
 * selected technology ships) and hands it to `<ExamSetup>`. If a previous
 * attempt for this technology is still in progress, its id is surfaced so the
 * user can resume instead of starting over.
 */
export default function ExamStartPage({ params }: StartProps) {
  const technology = params.technology as TechnologyId;
  const router = useRouter();
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);

  const attempts = useExamsStore((state) => state.attempts);
  const activeAttemptId = attempts.find(
    (attempt) => attempt.technology === technology && attempt.status === "IN_PROGRESS",
  )?.id;

  useEffect(() => {
    if (!catalogById(technology)) {
      setError(`Unknown technology: ${technology}`);
      return;
    }
    loadBank(technology)
      .then(setBank)
      .catch(() => setError("Failed to load the question bank."));
  }, [technology]);

  const meta = useMemo(() => (bank ? metaFromBank(bank) : null), [bank]);

  if (error) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!meta || !bank) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Loading exam…</p>
      </div>
    );
  }

  return (
    <ExamSetup
      meta={meta}
      bank={bank}
      activeAttemptId={activeAttemptId}
      onStart={(attemptId) => router.push(`/exams/${technology}/attempt/${attemptId}`)}
    />
  );
}

