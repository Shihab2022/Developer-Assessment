"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Clock, Flag, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Textarea } from "@/components/ui/Input";
import { CodingRunner } from "@/components/competitions/CodingRunner";
import { useCompetitionRun } from "@/hooks/competitions/useCompetitionRun";
import { useCompetitionsHydrated, useCompetitionsStore } from "@/store/competitions";
import { formatClock } from "@/store/exams";
import { orderedOptions } from "@/lib/competitions/paper";
import { cn } from "@/lib/utils";
import type { ResolvedRowForRun } from "@/lib/competitions/run-types";
import { InlineText } from "@/components/exams/QuestionContent";

export interface CompetitionAttemptIdentity {
  name: string;
  email: string;
  org: string;
  code: string;
}

export function CompetitionAttempt({
  competitionId,
  identity,
}: {
  competitionId: string;
  identity: CompetitionAttemptIdentity;
}) {
  const router = useRouter();
  return (
    <CompetitionAttemptPlayer
      competitionId={competitionId}
      identity={{
        participantName: identity.name,
        participantEmail: identity.email,
        organisation: identity.org,
        accessCode: identity.code,
      }}
      onExit={(path) => router.replace(path)}
    />
  );
}

interface PlayerIdentity {
  participantName: string;
  participantEmail: string;
  organisation: string;
  accessCode: string;
}

function CompetitionAttemptPlayer({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: PlayerIdentity;
  onExit: (path: string) => void;
}) {
  const hydrated = useCompetitionsHydrated();
  const competitions = hydrated
    ? useCompetitionsStore((state) => state.competitions)
    : [];
  const competition = competitions.find((c) => c.id === competitionId);
  const banks = hydrated ? useCompetitionsStore((state) => state.banks) : {};
  const banksReady = hydrated ? useCompetitionsStore((state) => state.banksReady) : false;

  const run = useCompetitionRun({
    competition: competition!,
    identity: { ...identity, accessCode: identity.accessCode },
    banks,
    banksReady,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flagged, setFlagged] = useState<ReadonlySet<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<"javascript" | "typescript">("javascript");
  const [code, setCode] = useState("");

  const orderedRows = run.orderedRows;
  const entry = run.entry;
  const currentRow = orderedRows[currentIndex];

  const remaining = useMemo(
    () =>
      orderedRows
        .slice(currentIndex + 1)
        .filter((row) => !flagged.has(row.row.itemId)).length,
    [orderedRows, currentIndex, flagged],
  );

  const isLast =
    orderedRows.length === 0 || currentIndex >= orderedRows.length - 1;

  function toggleFlag(itemId: string) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function handleSubmit() {
    if (!entry) return;
    setSubmitting(true);
    try {
      run.submit?.();
      setSubmitted(true);
      toast.success("Attempt submitted.");
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  if (!competition) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <p className="text-sm text-muted-foreground">Competition not found.</p>
        <Button
          asChild
          size="sm"
          className="mt-4"
          onClick={() => onExit("/competitions")}
        >
          <ArrowLeft className="size-4" />
          Back to competitions
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Clock className="size-5 text-foreground" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {competition.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {competition.organiser}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {competition.rules.durationMinutes > 0 && (
            <span className="font-mono tabular-nums">
              {formatClock(Math.max(0, competition.rules.durationMinutes * 60))}
            </span>
          )}
          <span className="tabular-nums">
            {orderedRows.length > 0
              ? `${currentIndex + 1} / ${orderedRows.length}`
              : "0 / 0"}
          </span>
          {remaining > 0 && (
            <span className="text-amber-600">{remaining} flagged</span>
          )}
        </div>
      </div>

      {orderedRows.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {orderedRows.map((row, index) => {
            const isCurrent = index === currentIndex;
            const isFlagged = flagged.has(row.row.itemId);
            return (
              <Button
                key={row.row.itemId}
                variant={isCurrent ? "outline" : "ghost"}
                size="sm"
                className={cn(
                  "h-9 w-9 p-0",
                  isCurrent && "ring-2 ring-foreground",
                  isFlagged && !isCurrent && "text-amber-600 border-amber-600",
                )}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Question ${index + 1}${isFlagged ? ", flagged" : ""}`}
              >
                {index + 1}
              </Button>
            );
          })}
        </div>
      )}

      {currentRow ? (
        <div className="space-y-6">
          {currentRow.row.kind === "mcq" && (
            <QuestionCard
              row={currentRow}
              selectedOptionId={entry?.answers[currentRow.row.itemId] ?? undefined}
              onSelect={(optionId) => run.answer(currentRow.row.itemId, optionId)}
              showExplanations={competition.rules.showExplanations}
              submitted={submitted}
            />
          )}

          {currentRow.row.kind === "coding" && (
            <CodingCard
              row={currentRow}
              language={codeLanguage}
              code={code}
              initialCode={currentRow.row.starterCode}
              onLanguageChange={setCodeLanguage}
              onCodeChange={setCode}
              onProgress={(updatedCode, passed, total) =>
                run.saveCode(currentRow.row.itemId, updatedCode, passed, total)
              }
              submitted={submitted}
            />
          )}

          {currentRow.row.kind === "written" && (
            <WrittenCard
              row={currentRow}
              answer={entry?.answers[currentRow.row.itemId] ?? ""}
              onAnswer={(value) => run.answer(currentRow.row.itemId, value)}
              submitted={submitted}
            />
          )}
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No questions to show.
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="outline"
          onClick={() => toggleFlag(currentRow?.row.itemId ?? "")}
          disabled={!currentRow}
        >
          <Flag className="size-4" />
          {flagged.has(currentRow?.row.itemId ?? "") ? "Unflag" : "Flag for review"}
        </Button>

        <div className="flex items-center gap-2">
          {!isLast && (
            <Button
              variant="outline"
              onClick={() =>
                setCurrentIndex((i) => Math.min(i + 1, orderedRows.length - 1))
              }
              disabled={!currentRow}
            >
              <ArrowRight className="size-4" />
              Next
            </Button>
          )}
          {isLast && (
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting || orderedRows.length === 0}
              className="min-w-[120px]"
            >
              <Send className="size-4" />
              Submit attempt
            </Button>
          )}
        </div>
      </div>

      {submitted && (
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-muted-foreground">
              Your attempt has been submitted. You can review your answers below.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

/* --------------------------------------------------------- question cards */

function QuestionCard({
  row,
  selectedOptionId,
  onSelect,
  showExplanations,
  submitted,
}: {
  row: ResolvedRowForRun;
  selectedOptionId?: string;
  onSelect: (id: string) => void;
  showExplanations: boolean;
  submitted: boolean;
}) {
  const mcq = row.row as Extract<ResolvedRowForRun["row"], { kind: "mcq" }>;
  // mcq.blocks is QuestionBlock[], whose shape is { type: "text"; value: string; }.
  const options = orderedOptions(mcq as any, undefined);

  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <Badge
            tone={
              mcq.difficulty === "EASY"
                ? "green"
                : mcq.difficulty === "HARD"
                ? "red"
                : "amber"
            }
            size="sm"
          >
            {mcq.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {mcq.sourceLabel}
          </span>
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          {mcq.title}
        </h2>

        {mcq.blocks && mcq.blocks.length > 0 && (
          <div className="space-y-2 text-sm text-foreground">
            {mcq.blocks.map((block, index) => (
              <p key={index}>
                <InlineText value={block.type === "text" ? block.value : String(block.value ?? "")} />
              </p>
            ))}
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">
            Choose one
          </legend>
          <RadioGroup value={selectedOptionId ?? ""} onValueChange={onSelect}>
            {options.map((option) => (
              <div key={option.id} className="flex items-start gap-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <label
                  htmlFor={option.id}
                  className="flex cursor-pointer items-start gap-2"
                >
                  <span className="order-1 block">
                    <InlineText value={option.text} />
                  </span>
                </label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        {submitted && showExplanations && mcq.explanation && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
            <p className="font-medium text-foreground">Explanation</p>
            <p className="mt-1 text-muted-foreground">{mcq.explanation}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function CodingCard({
  row,
  language,
  code,
  initialCode,
  onLanguageChange,
  onCodeChange,
  onProgress,
  submitted,
}: {
  row: ResolvedRowForRun;
  language: "javascript" | "typescript";
  code: string;
  initialCode: { javascript: string; typescript: string };
  onLanguageChange: (lang: "javascript" | "typescript") => void;
  onCodeChange: (code: string) => void;
  onProgress: (code: string, passed: number, total: number) => void;
  submitted: boolean;
}) {
  const coding = row.row as Extract<ResolvedRowForRun["row"], { kind: "coding" }>;

  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <Badge
            tone={
              coding.problem.difficulty === "EASY"
                ? "green"
                : coding.problem.difficulty === "HARD"
                ? "red"
                : "amber"
            }
            size="sm"
          >
            {coding.problem.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {coding.sourceLabel}
          </span>
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          {coding.problem.title}
        </h2>

        {coding.problem.description && (
          <div className="space-y-2 text-sm text-foreground">
            <p>
              <InlineText value={coding.problem.description} />
            </p>
          </div>
        )}

        <CodingRunner
          problem={coding.problem}
          starter={{
            javascript: initialCode.javascript,
            typescript: initialCode.typescript,
          }}
          initialCode={code}
          onProgress={onProgress}
        />

        {coding.problem.examples && coding.problem.examples.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Examples</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              {coding.problem.examples.map((example, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs"
                >
                  <p>Input: {JSON.stringify(example.input)}</p>
                  <p>Output: {JSON.stringify(example.output)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function WrittenCard({
  row,
  answer,
  onAnswer,
  submitted,
}: {
  row: ResolvedRowForRun;
  answer: string;
  onAnswer: (value: string) => void;
  submitted: boolean;
}) {
  const w = row.row as Extract<ResolvedRowForRun["row"], { kind: "written" }>;

  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <Badge
            tone={
              w.difficulty === "EASY"
                ? "green"
                : w.difficulty === "HARD"
                ? "red"
                : "amber"}
            size="sm"
          >
            {w.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {w.sourceLabel}
          </span>
        </div>

        <h2 className="text-lg font-semibold text-foreground">
          {w.title}
        </h2>

        {w.prompt && (
          <div className="space-y-2 text-sm text-foreground">
            <p>
              <InlineText value={w.prompt} />
            </p>
          </div>
        )}

        {w.maxWords && (
          <p className="text-sm text-muted-foreground">
            Maximum {w.maxWords} words
          </p>
        )}

        <Textarea
          value={answer}
          onChange={(event) => onAnswer(event.target.value)}
          placeholder="Write your answer here…"
          className="min-h-[120px]"
        />
      </CardBody>
    </Card>
  );
}
