"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { ExamShell } from "@/components/exams/ExamShell";
import { gradeEntry } from "@/lib/competitions/scoring";
import { resolvePaperRows } from "@/lib/competitions/paper";
import { formatDateTime } from "@/lib/utils";
import {
  competitionById,
  entryById,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";
import type { QuestionBank } from "@/lib/question-banks/types";


function EntryResultInner({ competitionId, entryId }: { competitionId: string; entryId: string }) {
  const hydrated = useCompetitionsHydrated();
  const competitions = hydrated
    ? useCompetitionsStore((state) => state.competitions)
    : [];
  const entries = hydrated
    ? useCompetitionsStore((state) => state.entries)
    : [];
  const banks = hydrated
    ? useCompetitionsStore((state) => state.banks)
    : {};
  const ownQuestions = hydrated
    ? useCompetitionsStore((state) => state.ownQuestions)
    : [];

  const competition = useMemo(
    () => competitionById(competitions, competitionId),
    [competitions, competitionId],
  );
  const entry = useMemo(
    () => entryById(entries, entryId),
    [entries, entryId],
  );

  const summary = useMemo(() => {
    if (!competition || !entry || Object.keys(banks).length === 0 && ownQuestions.length === 0) {
      return null;
    }
    const rows = resolvePaperRows({
      items: competition.items,
      banks,
      ownQuestions,
    }).rows;
    return gradeEntry(rows, entry, competition.rules);
  }, [competition, entry, banks, ownQuestions]);

  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  if (!competition || !entry) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-muted-foreground">Result not found.</p>
        <Button asChild size="sm" className="mt-4">
          <Link href={`/competitions/${competitionId}`}>
            <ArrowLeft className="size-4" />
            Back to competition
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        asChild
      >
        <Link href={`/competitions/${competitionId}`}>
          <ArrowLeft className="size-4" />
          Back to competition
        </Link>
      </Button>

      <div className="mb-8 flex items-center gap-3 text-center">
        {entry.status === "SUBMITTED" ? (
          <CheckCircle2 className="size-6 text-success" />
        ) : (
          <Clock className="size-6 text-muted-foreground" />
        )}
        <div>
          <p className="text-lg font-semibold text-foreground">
            {entry.status === "SUBMITTED" ? "Attempt submitted" : "Attempt in progress"}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(entry.startedAt)}
            {entry.submittedAt ? ` · submitted ${formatDateTime(entry.submittedAt)}` : ""}
          </p>
        </div>
      </div>

      {summary && (
        <Card>
          <CardBody className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <Trophy
                className={`size-8 ${
                  summary.percent >= competition.rules.passPercent
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
              />
              <div className="text-left">
                <p className="text-3xl font-bold text-foreground">
                  {summary.percent.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {summary.score} / {summary.maxScore} points
                  {summary.needsReview ? " · awaiting review" : ""}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-sm">
              <Badge tone={summary.passed ? "green" : "red"} size="md">
                {summary.passed ? "Passed" : "Not passed"}
              </Badge>
              <span className="text-muted-foreground">
                {summary.correctCount} correct · {summary.totalCount} total
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Answers</h2>
        <Card className="border-border">
          <CardBody className="space-y-4">
            {competition.items.map((item) => {
              const answer = entry.answers[item.id] ?? "";
              const coding = entry.coding[item.id];
              return (
                <div key={item.id} className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge size="sm">
                      {item.source === "library-mcq"
                        ? "Question bank"
                        : item.source === "library-coding"
                        ? "Coding"
                        : "Own question"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.points} point{item.points === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-foreground">
                    {item.id}
                  </p>
                  {answer && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your answer: {answer}
                    </p>
                  )}
                  {coding && (
                    <p className="mt-2 text-xs text-muted-foreground font-mono">
                      Code progress: {coding.passed} / {coding.total} tests passing
                    </p>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


export default function CompetitionResultPage({
  params,
}: {
  params: { id: string; entryId: string };
}) {
  return (
    <ExamShell>
      <Suspense fallback={<Spinner className="mx-auto my-12" />}>
        <EntryResultInner
          competitionId={params.id}
          entryId={params.entryId}
        />
      </Suspense>
    </ExamShell>
  );
}
