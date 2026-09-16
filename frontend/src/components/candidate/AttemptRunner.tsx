"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAttempt, useAttemptQuestions, useSaveAnswer, useSubmitAttempt,
} from "@/hooks/useAttempts";
import { useAttemptTimer } from "@/hooks/useAttemptTimer";
import { useAntiCheatingMonitor } from "@/hooks/useAntiCheatingMonitor";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress, Spinner } from "@/components/ui/Primitives";
import { Checkbox } from "@/components/ui/Checkbox";
import { SelectField } from "@/components/ui/Select";
import { TextareaField } from "@/components/ui/Input";
import { DifficultyBadge, TypeBadge } from "@/components/ui/Badge";
import { PROGRAMMING_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { AttemptAnswer, Problem } from "@/lib/types";

/** Local, editable copy of each question's answer. */
interface DraftAnswer {
  selectedOptionId?: string;
  selectedOptionIds?: string[];
  code?: string;
  programmingLanguage?: string;
  written?: string;
}

const TERMINAL = ["SUBMITTED", "AUTO_SUBMITTED", "EVALUATING", "COMPLETED", "EXPIRED"];

function formatClock(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export function AttemptRunner({ attemptId }: { attemptId: string }) {
  const router = useRouter();
  const { data: attempt, isLoading: attemptLoading } = useAttempt(attemptId);
  const { data: questions, isLoading: questionsLoading } = useAttemptQuestions(attemptId);
  const timer = useAttemptTimer(attemptId);
  const save = useSaveAnswer(attemptId);
  const submit = useSubmitAttempt(attemptId);

  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, DraftAnswer>>({});
  const [hydrated, setHydrated] = useState(false);

  const assessment = attempt?.assessment;
  const monitor = useAntiCheatingMonitor(attemptId, {
    enabled: Boolean(attempt?.status === "IN_PROGRESS"),
    antiCheatingEnabled: assessment?.antiCheatingEnabled ?? true,
  });

  /* Hydrate drafts from the server's saved answers exactly once. */
  useEffect(() => {
    if (hydrated || !attempt?.answers) return;
    const next: Record<string, DraftAnswer> = {};
    (attempt.answers as AttemptAnswer[]).forEach((a) => {
      const answer = (a.answer ?? {}) as Record<string, unknown>;
      next[a.problemId] = {
        selectedOptionId:
          typeof answer.selectedOptionId === "string" ? answer.selectedOptionId : undefined,
        selectedOptionIds: Array.isArray(answer.selectedOptionIds)
          ? (answer.selectedOptionIds as string[])
          : undefined,
        code: a.code ?? undefined,
        programmingLanguage: a.programmingLanguage ?? undefined,
        written: typeof answer.text === "string" ? answer.text : undefined,
      };
    });
    setDrafts(next);
    setHydrated(true);
  }, [attempt?.answers, hydrated]);

  /* Auto-submit exactly once when the server-driven clock expires. */
  useEffect(() => {
    if (timer.isExpired && attempt?.status === "IN_PROGRESS" && !submit.isPending) {
      submit.mutate(undefined, {
        onSuccess: () => router.push("/candidate/attempts"),
      });
    }
  }, [timer.isExpired, attempt?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = questions?.[index];
  const problem = current?.problem as Problem | undefined;
  const draft = problem ? (drafts[problem.id] ?? {}) : {};

  const update = (patch: DraftAnswer) => {
    if (!problem) return;
    const next = { ...draft, ...patch };
    setDrafts((d) => ({ ...d, [problem.id]: next }));
    save.mutate({
      problemId: problem.id,
      answer:
        next.selectedOptionIds != null
          ? { selectedOptionIds: next.selectedOptionIds }
          : next.written != null
            ? { text: next.written }
            : { selectedOptionId: next.selectedOptionId },
      code: next.code,
      programmingLanguage: next.programmingLanguage,
    });
  };

  const answeredCount = useMemo(
    () =>
      (questions ?? []).filter((q) => {
        const d = drafts[q.problemId];
        if (!d) return false;
        return (
          d.selectedOptionId != null ||
          (d.selectedOptionIds?.length ?? 0) > 0 ||
          (d.written?.trim().length ?? 0) > 0 ||
          (d.code?.trim().length ?? 0) > 0
        );
      }).length,
    [questions, drafts],
  );

  if (attemptLoading || questionsLoading) return <Spinner className="mx-auto my-16" />;
  if (!attempt) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-muted-foreground">Attempt not found.</CardBody>
      </Card>
    );
  }

  if (TERMINAL.includes(attempt.status)) {
    return <AttemptReview attemptId={attemptId} status={attempt.status} submittedAt={attempt.submittedAt} />;
  }

  if (!problem) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-muted-foreground">
          This assessment has no questions yet.
        </CardBody>
      </Card>
    );
  }

  const multiSelect = (problem.options ?? []).filter((o) => o.isCorrect).length > 1;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-foreground">{assessment?.title ?? "Assessment"}</p>
            <p className="text-xs text-muted-foreground">
              Question {index + 1} of {questions?.length ?? 0} · {answeredCount} answered
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "text-xl font-bold tabular-nums",
                timer.isLowTime ? "text-destructive" : "text-foreground",
              )}
            >
              {formatClock(timer.remainingSeconds)}
            </div>
            <Button
              onClick={() => {
                if (confirm("Submit your attempt? You cannot change answers afterwards.")) {
                  submit.mutate(undefined, {
                    onSuccess: () => router.push("/candidate/attempts"),
                  });
                }
              }}
              disabled={submit.isPending}
              size="sm"
            >
              {submit.isPending ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </CardBody>
        <Progress
          value={questions?.length ? (answeredCount / questions.length) * 100 : 0}
          className="h-1 rounded-b-lg"
        />
      </Card>

      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <TypeBadge type={problem.type} />
                <DifficultyBadge difficulty={problem.difficulty} />
                <span className="text-xs text-muted-foreground">{current?.points} points</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground">{problem.title}</h2>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm text-foreground">{problem.description}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          {problem.type === "MCQ" && (
            <div className="space-y-2">
              {(problem.options ?? []).map((option) =>
                multiSelect ? (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={(draft.selectedOptionIds ?? []).includes(option.id ?? "")}
                      onCheckedChange={(checked) => {
                        const current = new Set(draft.selectedOptionIds ?? []);
                        if (checked && option.id) current.add(option.id);
                        else current.delete(option.id ?? "");
                        update({ selectedOptionIds: Array.from(current) });
                      }}
                    />
                    {option.text}
                  </label>
                ) : (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="radio"
                      name={`mcq-${problem.id}`}
                      className="accent-primary-600"
                      checked={draft.selectedOptionId === option.id}
                      onChange={() => update({ selectedOptionId: option.id })}
                    />
                    {option.text}
                  </label>
                ),
              )}
            </div>
          )}

          {problem.type === "CODING" && (
            <div className="space-y-3">
              <SelectField
                label="Language"
                value={draft.programmingLanguage ?? DEFAULT_LANGUAGE.value}
                onValueChange={(v) => update({ programmingLanguage: v })}
                options={PROGRAMMING_LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
                className="max-w-xs"
              />
              <TextareaField
                label="Your solution"
                rows={14}
                className="font-mono text-sm"
                value={draft.code ?? ""}
                onChange={(e) => update({ code: e.target.value })}
              />
            </div>
          )}

          {problem.type === "WRITTEN" && (
            <TextareaField
              label="Your answer"
              rows={8}
              value={draft.written ?? ""}
              onChange={(e) => update({ written: e.target.value })}
            />
          )}
        </CardBody>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          Previous
        </Button>
        <Button
          onClick={() => setIndex((i) => Math.min((questions?.length ?? 1) - 1, i + 1))}
          disabled={index === (questions?.length ?? 1) - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );
}


function AttemptReview({
  attemptId,
  status,
  submittedAt,
}: {
  attemptId: string;
  status: string;
  submittedAt?: string | null;
}) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardBody className="space-y-3 py-10 text-center">
        <h2 className="text-xl font-semibold text-foreground">Attempt submitted</h2>
        <p className="text-sm text-muted-foreground">
          {status === "EXPIRED"
            ? "This attempt expired before submission — answers saved up to the deadline stand."
            : status === "EVALUATING"
              ? "Your answers are being evaluated."
              : `Submitted${submittedAt ? ` on ${formatDateTime(submittedAt)}` : ""}.`}
        </p>
        <Button variant="outline" size="sm" asChild>
          <a href="/candidate/attempts">Back to my attempts</a>
        </Button>
      </CardBody>
    </Card>
  );
}

