"use client";

import { CheckCircle2, Clock, ShieldAlert, Trophy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle, Progress } from "@/components/ui/Primitives";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { INTERVIEW_DECISION_LABELS } from "@/lib/constants";
import type { InterviewSessionResult } from "@/lib/types";

interface Props {
  result: InterviewSessionResult | null;
  loading: boolean;
  /** Set when proctoring ended the session (requirements 8-10). */
  terminatedReason?: string | null;
}

/**
 * The candidate's end screen: suspended (0 marks), the AI result when the
 * organisation shares scores, or a neutral "submitted" state.
 */
export function InterviewFinished({ result, loading, terminatedReason }: Props) {
  const terminated = Boolean(result?.terminated || terminatedReason);

  if (loading && !result) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardBody className="flex flex-col items-center gap-4 py-14 text-center">
          <span className="size-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <div>
            <p className="font-semibold text-foreground">Reviewing your interview…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The AI is marking each answer and preparing the report for the organisation.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <Progress value={85} />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (terminated) {
    return (
      <Card className="mx-auto max-w-xl border-rose-200 dark:border-rose-900">
        <CardHeader
          icon={<ShieldAlert className="size-4" />}
          title="Interview suspended"
          subtitle="The proctoring policy ended this session"
        />
        <CardBody className="space-y-4">
          <Alert variant="destructive">
            <AlertTitle>Suspended with 0 marks</AlertTitle>
            <AlertDescription>
              {terminatedReason ??
                result?.terminationReason ??
                "A proctoring violation was detected during the interview."}
            </AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground">
            Your session was recorded and a report — including the evidence of the violation — was
            sent to the organisation. If you believe this was a mistake, contact the recruiter who
            invited you.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (!result || result.status === "PROCESSING") {
    return (
      <Card className="mx-auto max-w-xl">
        <CardBody className="flex items-center gap-3 py-10">
          <span className="size-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Your answers are being reviewed…</p>
        </CardBody>
      </Card>
    );
  }

  const visible = result.scoreVisible;
  const decision = result.decision ? INTERVIEW_DECISION_LABELS[result.decision] : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader
          icon={<CheckCircle2 className="size-4" />}
          title="Interview submitted"
          subtitle={`Thank you, ${result.candidateName}. Your answers are with the organisation.`}
          action={
            decision ? (
              <Badge tone={result.decision === "NO_HIRE" ? "red" : "green"}>{decision}</Badge>
            ) : undefined
          }
        />
        <CardBody className="space-y-5">
          {visible && typeof result.percentage === "number" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4 text-center">
                <Trophy className="mx-auto mb-2 size-4 text-primary-600" />
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {result.totalScore}/{result.maxScore}
                </p>
                <p className="text-xs text-muted-foreground">Total marks</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="mt-1 text-2xl font-bold text-foreground">{result.percentage}%</p>
                <Progress value={result.percentage} className="mt-3" />
                <p className="mt-2 text-xs text-muted-foreground">Score</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <Clock className="mx-auto mb-2 size-4 text-muted-foreground" />
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {result.integrityScore}/100
                </p>
                <p className="text-xs text-muted-foreground">Integrity</p>
              </div>
            </div>
          )}

          {!visible && (
            <Alert variant="info">
              <AlertTitle>Scores are handled by the organisation</AlertTitle>
              <AlertDescription>
                The reviewer decided not to share the numeric score. You will hear from them
                directly about the next steps.
              </AlertDescription>
            </Alert>
          )}

          {visible && result.summary && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">AI summary</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
            </div>
          )}

          {visible && result.strengths.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Strengths</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {visible && result.improvements.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-foreground">Areas to improve</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {result.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default InterviewFinished;

