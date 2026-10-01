"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, Lightbulb, RefreshCw, ShieldAlert, Sparkles, Video } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Progress,
  Skeleton,
} from "@/components/ui/Primitives";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DescriptionList, PageHeader } from "@/components/ui/Card";
import { useInterviewSessionReport, useReReviewSession } from "@/hooks/useInterviews";
import { INTERVIEW_DECISION_LABELS, INTERVIEW_VIOLATION_LABELS, INTERVIEW_VERDICT_LABELS } from "@/lib/constants";
import { formatDateTime, formatPercent } from "@/lib/utils";

/** Badge tone per proctoring severity. */
const SEVERITY_TONE: Record<string, "gray" | "amber" | "red"> = {
  LOW: "gray",
  MEDIUM: "amber",
  HIGH: "amber",
  CRITICAL: "red",
};

export default function InterviewSessionReportPage() {
  const params = useParams<{ id: string; sessionId: string }>();
  const interviewId = params?.id ?? "";
  const sessionId = params?.sessionId ?? "";

  const report = useInterviewSessionReport(interviewId, sessionId);
  const reReview = useReReviewSession(interviewId, sessionId);

  if (report.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (report.isError || !report.data) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-muted-foreground">
          This report could not be loaded.
        </CardBody>
      </Card>
    );
  }

  const { session, answers, violations, interview } = report.data;
  const terminated = session.status === "TERMINATED";

  return (
    <>
      <PageHeader
        title={session.candidateName}
        subtitle={`${interview.title} · ${interview.technology.toUpperCase()} · ${session.candidateEmail}`}
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/recruiter/interviews/${interviewId}`}>
              <ArrowLeft className="size-4" />
              Back to interview
            </Link>
          </Button>
        }
        actions={
          <>
            <StatusBadge status={session.status} />
            {session.decision && (
              <Badge tone={session.decision === "NO_HIRE" ? "red" : "green"}>
                {INTERVIEW_DECISION_LABELS[session.decision]}
              </Badge>
            )}
            <Badge tone="slate">
              <Sparkles className="size-3" />
              {session.reviewProvider === "openai" ? "LLM review" : "Rubric review"}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              loading={reReview.isPending}
              disabled={terminated || session.status === "IN_PROGRESS"}
              onClick={() => reReview.mutate()}
            >
              <RefreshCw className="size-4" />
              Re-run AI review
            </Button>
          </>
        }
      />

      {terminated && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Suspended by proctoring — 0 marks</AlertTitle>
          <AlertDescription>{session.terminationReason}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="AI review" subtitle="Marks and narrative for the hiring team" />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {session.totalScore}/{session.maxScore}
                </p>
                <p className="text-xs text-muted-foreground">Total marks</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-center text-2xl font-bold text-foreground">
                  {formatPercent(session.percentage)}
                </p>
                <Progress value={session.percentage} className="mt-2" />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Pass mark {interview.passScore}% · {session.passesInterview ? "Passed" : "Not passed"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{session.integrityScore}/100</p>
                <p className="text-xs text-muted-foreground">
                  Integrity ({session.violationCount} signals)
                </p>
              </div>
            </div>

            {session.aiSummary && (
              <p className="text-sm leading-relaxed text-muted-foreground">{session.aiSummary}</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Strengths</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {session.aiStrengths.length ? (
                    session.aiStrengths.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>None flagged</li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Improvements</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {session.aiImprovements.length ? (
                    session.aiImprovements.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>None flagged</li>
                  )}
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Session" />
          <CardBody>
            <DescriptionList
              columns={1}
              items={[
                { label: "Started", value: formatDateTime(session.startedAt) },
                { label: "Submitted", value: formatDateTime(session.submittedAt) },
                { label: "Reviewed", value: formatDateTime(session.reviewedAt) },
                { label: "IP address", value: session.ipAddress ?? "—" },
                {
                  label: "Device",
                  value: (
                    <span className="break-words text-xs">
                      {(session.deviceInfo as { platform?: string } | null)?.platform ?? "unknown"}
                      {" · "}
                      {(session.deviceInfo as { screen?: string } | null)?.screen ?? ""}
                    </span>
                  ),
                },
                {
                  label: "User agent",
                  value: (
                    <span className="break-words text-xs">{session.userAgent ?? "—"}</span>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>


      {violations.length > 0 && (
        <Card className="mt-4">
          <CardHeader
            icon={<ShieldAlert className="size-4" />}
            title={`Proctoring timeline (${violations.length})`}
            subtitle="Every signal the browser reported, with the evidence frame it captured"
          />
          <CardBody className="space-y-3">
            {violations.map((violation) => (
              <div
                key={violation.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                {violation.snapshot && (
                  // Evidence frame captured by the candidate's camera (base64 JPEG).
                  <img
                    src={violation.snapshot}
                    alt="Evidence frame"
                    className="h-16 w-24 shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={SEVERITY_TONE[violation.severity] ?? "gray"} size="sm">
                      {violation.severity}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {INTERVIEW_VIOLATION_LABELS[violation.type] ?? violation.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(violation.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{violation.description}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}


      <Card className="mt-4">
        <CardHeader
          title={`Answers (${answers.length})`}
          subtitle="Recorded answer, transcript, evidence frames and the AI mark for each question"
        />
        <CardBody className="space-y-4">
          {answers.map((answer) => (
            <div key={answer.id} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Q{answer.order}</span>
                {answer.topic && (
                  <Badge tone="gray" size="sm">
                    {answer.topic}
                  </Badge>
                )}
                <Badge tone={answer.score && answer.score > 0 ? "green" : "red"} size="sm">
                  {answer.score ?? 0}/{answer.maxScore} marks
                </Badge>
                {answer.aiFeedback && (
                  <span className="text-xs text-muted-foreground">
                    {INTERVIEW_VERDICT_LABELS[
                      (answer as { aiReview?: { verdict?: string } | null }).aiReview?.verdict ?? ""
                    ] ?? ""}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {answer.timeSpentSeconds ?? 0}s of {answer.timeSeconds ?? interview.questionTimeSeconds}s
                </span>
                {answer.hintsUsed > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <Lightbulb className="size-3" />
                    {answer.hintsUsed} hint{answer.hintsUsed > 1 ? "s" : ""}
                  </span>
                )}
                <StatusBadge status={answer.status} size="sm" />
              </div>

              <p className="text-sm font-medium text-foreground">{answer.prompt}</p>

              {answer.recordingUrl ? (
                <video
                  controls
                  src={answer.recordingUrl}
                  className="mt-3 w-full max-w-md rounded-lg border border-border bg-black"
                />
              ) : (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Video className="size-3" />
                  Recorded answer: {answer.recordingSeconds ?? 0}s
                  {answer.recordingSeconds ? " (clip not stored)" : ""}
                </p>
              )}

              {answer.snapshots && answer.snapshots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {answer.snapshots.map((frame, frameIndex) => (
                    <img
                      key={`${answer.id}-${frameIndex}`}
                      src={frame}
                      alt={`Answer ${answer.order} evidence ${frameIndex + 1}`}
                      className="h-20 w-28 rounded border border-border object-cover"
                    />
                  ))}
                </div>
              )}

              <div className="mt-3 rounded-lg bg-muted/40 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Transcript
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {answer.transcript?.trim() || (
                    <span className="text-muted-foreground">No speech was captured.</span>
                  )}
                </p>
              </div>

              {answer.aiFeedback && (
                <p className="mt-3 text-sm text-muted-foreground">{answer.aiFeedback}</p>
              )}

              {(answer.keywordHits.length > 0 || answer.missingKeywords.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {answer.keywordHits.map((keyword) => (
                    <Badge key={`hit-${keyword}`} tone="green" size="sm">
                      ✓ {keyword}
                    </Badge>
                  ))}
                  {answer.missingKeywords.map((keyword) => (
                    <Badge key={`miss-${keyword}`} tone="gray" size="sm">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}

              <details className="mt-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer">Expected answer &amp; hints</summary>
                <p className="mt-2">
                  <strong>Hints:</strong> {answer.hints.join(" · ") || "—"}
                </p>
                <p className="mt-1">
                  <strong>Model answer:</strong> {answer.modelAnswer ?? "—"}
                </p>
                {answer.hintsRevealed.length > 0 && (
                  <p className="mt-1">
                    <strong>Revealed by the candidate:</strong> {answer.hintsRevealed.join(" · ")}
                  </p>
                )}
              </details>
            </div>
          ))}

          {answers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No answers were recorded for this session.
            </p>
          )}
        </CardBody>
      </Card>
    </>
  );
}

