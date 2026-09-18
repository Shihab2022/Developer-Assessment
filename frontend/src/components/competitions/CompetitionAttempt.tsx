"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Clock, Eye, EyeOff, Flag, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { Textarea } from "@/components/ui/Input";
import { QuestionContent } from "@/components/exams/QuestionContent";
import { CodingRunner } from "@/components/competitions/CodingRunner";
import { useCompetitionRun } from "@/hooks/competitions/useCompetitionRun";
import { useCompetitionsHydrated } from "@/store/competitions";
import { formatClock } from "@/store/exams";
import { orderedOptions } from "@/lib/competitions/paper";
import { runTests } from "@/lib/practice/runner";
import { libraryProblem } from "@/lib/competitions/library";
import { cn } from "@/lib/utils";
import type { ResolvedRowForRun } from "@/lib/competitions/run-types";
import { InlineText } from "@/components/exams/QuestionContent";


/**
 * Timed attempt player (requirement 4 — sit the paper under the host's
 * rules, requirement 6 — idea: seeded order, flagging, proctor signals).
 */
export function CompetitionAttempt({
  competitionId,
  identity,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
}) {
  const router = useRouter();
  return (
    <CompetitionAttemptInner
      competitionId={competitionId}
      identity={identity}
      onExit={(path) => router.replace(path)}
    />
  );
}

function CompetitionAttemptInner({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  return (
    <AttemptBody competitionId={competitionId} identity={identity} onExit={onExit} />
  );
}

function AttemptBody({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  const hydrated = useCompetitionsHydrated();
  return hydrated ? (
    <AttemptLoaded competitionId={competitionId} identity={identity} onExit={onExit} />
  ) : (
    <Spinner className="mx-auto my-12" />
  );
}

function AttemptLoaded({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  return (
    <AttemptRunner competitionId={competitionId} identity={identity} onExit={onExit} />
  );
}

function AttemptRunner({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  return (
    <AttemptSession competitionId={competitionId} identity={identity} onExit={onExit} />
  );
}


function AttemptSession({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  const hydrated = useCompetitionsHydrated();
  if (!hydrated) return <Spinner className="mx-auto my-12" />;
  return <AttemptPlayground competitionId={competitionId} identity={identity} onExit={onExit} />;
}

function AttemptPlayground({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  return <AttemptTimer competitionId={competitionId} identity={identity} onExit={onExit} />;
}


function AttemptTimer({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  return <AttemptPaper competitionId={competitionId} identity={identity} onExit={onExit} />;
}

function AttemptPaper({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  return <AttemptViewer competitionId={competitionId} identity={identity} onExit={onExit} />;
}

function AttemptViewer({
  competitionId,
  identity,
  onExit,
}: {
  competitionId: string;
  identity: { name: string; email: string; org: string; code: string };
  onExit: (path: string) => void;
}) {
  return (
    <CompetitionAttemptPlayer
      competitionId={competitionId}
      identity={{
        participantName: identity.name,
        participantEmail: identity.email,
        organisation: identity.org,
        accessCode: identity.code,
      }}
      onExit={onExit}
    />
  );

/* --- competition attempt player --- */

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
  const competitions = hydrated ? useCompetitionsStore((state) => state.competitions) : [];
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
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<"javascript" | "typescript">("javascript");
  const [code, setCode] = useState("");

  const orderedRows = run.orderedRows;
  const entry = run.entry;
  const currentRow = orderedRows[currentIndex];
  const isLast = currentIndex >= orderedRows.length - 1;

  if (!hydrated || !competition) {
    return <Spinner className="mx-auto my-12" />;
  }

  const totalMinutes = competition.rules.durationMinutes;
  const startedAt = entry?.startedAt ? new Date(entry.startedAt).getTime() : Date.now();
  const totalMs = totalMinutes * 60 * 1000;
  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, totalMs - elapsed);
  const remainingLabel = formatClock(remaining);

  const toggleFlag = (itemId: string) => {
    setFlagged((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
    run.proctor(flagged.has(itemId) ? "unflag" : "flag");
  };

  const handleSubmit = async () => {
    if (submitting || !entry) return;
    setSubmitting(true);
    try {
      const entryId = run.submit();
      if (entryId) {
        setSubmitted(true);
        toast.success("Attempt submitted");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < orderedRows.length) {
      setCurrentIndex(index);
    }
  };

  const progress = orderedRows.length > 0 ? ((currentIndex + 1) / orderedRows.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge tone={competition.status === "OPEN" ? "green" : "amber"} size="sm">
            {competition.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <span className="text-sm font-mono tabular-nums">{remainingLabel}</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {currentIndex + 1} of {orderedRows.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question navigation grid */}
      <div className="grid gap-2 sm:grid-cols-5">
        {orderedRows.map((row, index) => {
          const isFlagged = flagged.has(row.row.itemId);
          const isCurrent = index === currentIndex;
          return (
            <button
              key={row.row.itemId}
              type="button"
              onClick={() => goToQuestion(index)}
              className={cn(
                "flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                isCurrent
                  ? "border-primary-600 bg-primary-600/10 text-foreground"
                  : isFlagged
                    ? "border-amber-500 bg-amber-500/10 text-amber-700"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
              )}
            >
              {index + 1}
              {isFlagged && <Flag className="ml-1 size-3" />}
            </button>
          );
        })}
      </div>

      {/* Current question rendering */}
      {currentRow && currentRow.row.kind === "mcq" && (
        <QuestionCard
          row={currentRow}
          selectedOptionId={entry?.answers[currentRow.row.itemId]}
          onSelect={(optionId) => run.answer(currentRow.row.itemId, optionId)}
          showExplanations={competition.rules.showExplanations}
          submitted={submitted}
        />
      )}

      {currentRow && currentRow.row.kind === "coding" && (
        <CodingCard
          row={currentRow}
          language={codeLanguage}
          code={code}
          initialCode={currentRow.row.starterCode}
          onLanguageChange={setCodeLanguage}
          onCodeChange={setCode}
          onProgress={(passed, total) => run.saveCode(currentRow.row.itemId, code, passed, total)}
          submitted={submitted}
        />
      )}

      {currentRow && currentRow.row.kind === "written" && (
        <WrittenCard
          row={currentRow}
          answer={entry?.answers[currentRow.row.itemId] ?? ""}
          onAnswer={(value) => run.answer(currentRow.row.itemId, value)}
          submitted={submitted}
        />
      )}

      {!currentRow && (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          No questions to show.
        </div>
      )}

      {/* Flag and submit controls */}
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
              onClick={() => setCurrentIndex((i) => Math.min(i + 1, orderedRows.length - 1))}
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
              disabled={submitting}
              className="min-w-[120px]"
            >
              <Send className="size-4" />
              Submit attempt
            </Button>
          )}
        </div>
      </div>

      {/* Submitted confirmation */}
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
  const options = orderedOptions(row.row as any, undefined);

  return (
    <Card className="border-border">
      <CardBody className="space-y-4">
        <div className="flex items-start gap-3">
          <Badge tone={row.row.difficulty === "EASY" ? "green" : row.row.difficulty === "HARD" ? "red" : "amber"} size="sm">
            {row.row.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">{row.row.sourceLabel}</span>
        </div>

        <h2 className="text-lg font-semibold text-foreground">{row.row.title}</h2>

        {row.row.blocks && row.row.blocks.length > 0 && (
          <div className="space-y-2 text-sm text-foreground">
            {row.row.blocks.map((block, index) => (
              <p key={index}>
                <InlineText value={block.text} />
              </p>
            ))}
          </div>
        )}

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Choose one</legend>
          <RadioGroup value={selectedOptionId ?? ""} onValueChange={onSelect}>
            {options.map((option) => (
              <div key={option.id} className="flex items-start gap-3">
                <RadioGroupItem value={option.id} id={option.id} />
                <label htmlFor={option.id} className="flex cursor-pointer items-start gap-2">
                  <span className="order-1 block">
                    <InlineText value={option.text} />
                  </span>
                </label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        {submitted && showExplanations && row.row.explanation && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
            <p className="font-medium text-foreground">Explanation</p>
            <p className="mt-1 text-muted-foreground">{row.row.explanation}</p>
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
  language: 'javascript' | 'typescript';
  code: string;
  initialCode: { javascript: string; typescript: string };
  onLanguageChange: (lang: 'javascript' | 'typescript') => void;
  onCodeChange: (code: string) => void;
  onProgress: (passed: number, total: number) => void;
  submitted: boolean;
}) {
  return (
    <Card className='border-border'>
      <CardBody className='space-y-4'>
        <div className='flex items-start gap-3'>
          <Badge tone={row.row.difficulty === 'EASY' ? 'green' : row.row.difficulty === 'HARD' ? 'red' : 'amber'} size='sm'>
            {row.row.difficulty}
          </Badge>
          <span className='text-xs text-muted-foreground'>{row.row.sourceLabel}</span>
        </div>

        <h2 className='text-lg font-semibold text-foreground'>{row.row.title}</h2>

        {row.row.description && (
          <div className='space-y-2 text-sm text-foreground'>
            <p>
              <InlineText value={row.row.description} />
            </p>
          </div>
        )}

        <CodingRunner
          problem={row.row.problem!}
          starter={{ javascript: initialCode.javascript, typescript: initialCode.typescript }}
          initialCode={code}
          onProgress={onProgress}
        />

        {row.row.examples && row.row.examples.length > 0 && (
          <div className='space-y-2'>
            <p className='text-sm font-medium text-foreground'>Examples</p>
            <div className='space-y-2 text-sm text-muted-foreground'>
              {row.row.examples.map((example, index) => (
                <div key={index} className='rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs'>
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
  return (
    <Card className='border-border'>
      <CardBody className='space-y-4'>
        <div className='flex items-start gap-3'>
          <Badge tone={row.row.difficulty === 'EASY' ? 'green' : row.row.difficulty === 'HARD' ? 'red' : 'amber'} size='sm'>
            {row.row.difficulty}
          </Badge>
          <span className='text-xs text-muted-foreground'>{row.row.sourceLabel}</span>
        </div>

        <h2 className='text-lg font-semibold text-foreground'>{row.row.title}</h2>

        {row.row.prompt && (
          <div className='space-y-2 text-sm text-foreground'>
            <p>
              <InlineText value={row.row.prompt} />
            </p>
          </div>
        )}

        {row.row.maxWords && (
          <p className='text-sm text-muted-foreground'>
            Maximum {row.row.maxWords} words
          </p>
        )}

        <Textarea
          value={answer}
          onChange={(event) => onAnswer(event.target.value)}
          placeholder='Write your answer here…'
          className='min-h-[120px]'
        />

        {submitted && row.row.written?.referenceAnswer && (
          <div className='rounded-lg border border-border bg-muted/40 p-3 text-sm'>
            <p className='font-medium text-foreground'>Reference answer</p>
            <p className='mt-1 text-muted-foreground whitespace-pre-wrap'>{row.row.written.referenceAnswer}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
