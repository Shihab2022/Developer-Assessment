"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle, Skeleton } from "@/components/ui/Primitives";
import { Card, CardBody } from "@/components/ui/Card";
import { BrandLogo } from "@/components/brand/Logo";
import { InterviewPreflight } from "@/components/interviews/InterviewPreflight";
import { InterviewRunner } from "@/components/interviews/InterviewRunner";
import { InterviewFinished } from "@/components/interviews/InterviewFinished";
import { useInterviewProctor } from "@/hooks/useInterviewProctor";
import {
  usePublicInterviewInfo,
  useReportInterviewViolation,
  useStartInterviewSession,
  useSubmitInterview,
} from "@/hooks/useInterviewSession";
import { getErrorMessage } from "@/lib/api";
import type { StartSessionResult } from "@/lib/types";

type Phase = "preflight" | "running" | "finished";

/**
 * Public candidate link — `/interview/<token>`.
 *
 * The token is either the shared interview link or a per-candidate invite
 * link. Opening it requests the camera + microphone (requirement 4), runs the
 * proctored question flow (requirements 5-11) and finishes with the AI result.
 */
export default function InterviewPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [phase, setPhase] = useState<Phase>("preflight");
  const [startResult, setStartResult] = useState<StartSessionResult | null>(null);
  const [terminatedReason, setTerminatedReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const info = usePublicInterviewInfo(token);
  const start = useStartInterviewSession(token);
  const submit = useSubmitInterview(token);

  const reportViolation = useReportInterviewViolation(token, {
    onTerminated: (reason) => {
      setTerminatedReason(reason);
      setPhase("finished");
      setStartResult(null);
      proctor.stop();
      // Flush the final state so the screen reflects the 0-mark suspension.
      void submit.mutateAsync("PROCTORING").catch(() => undefined);
    },
  });

  const proctor = useInterviewProctor({
    enabled: phase === "running",
    onViolation: (violation) => reportViolation.mutate(violation),
  });

  const handleStart = (identity: { candidateName?: string; candidateEmail?: string }) => {
    start.mutate(
      {
        consentGiven: true,
        candidateName: identity.candidateName,
        candidateEmail: identity.candidateEmail,
        deviceInfo: {
          platform: navigator.platform,
          language: navigator.language,
          userAgent: navigator.userAgent,
          cameraReady: proctor.cameraStatus === "ready",
          micReady: proctor.micStatus === "ready",
          faceDetector: proctor.faceDetectorAvailable,
          screen: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
      {
        onSuccess: (result) => {
          setStartResult(result);
          setPhase("running");
        },
      },
    );
  };

  const handleComplete = async (
    reason: "CANDIDATE_SUBMIT" | "TIME_EXPIRED" | "PROCTORING",
  ) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await submit.mutateAsync(reason);
      setTerminatedReason(result.terminated ? result.terminationReason ?? null : null);
      setPhase("finished");
    } finally {
      setSubmitting(false);
      proctor.stop();
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    }
  };

  const handleViolation = (payload: Parameters<typeof reportViolation.mutate>[0]) =>
    reportViolation.mutate(payload);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="container flex items-center justify-between">
          <BrandLogo size="sm" />
          <span className="text-xs font-medium text-muted-foreground">
            Proctored AI video interview
          </span>
        </div>
      </header>

      <main className="container py-6">
        {info.isPending && (
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {info.isError && (
          <Alert variant="destructive" className="mx-auto max-w-xl">
            <AlertTitle>This interview link is not valid</AlertTitle>
            <AlertDescription>{getErrorMessage(info.error)}</AlertDescription>
          </Alert>
        )}

        {info.data && phase === "preflight" && (
          <InterviewPreflight
            info={info.data}
            proctor={proctor}
            starting={start.isPending}
            onStart={handleStart}
          />
        )}

        {phase === "running" && startResult && (
          <InterviewRunner
            token={token}
            start={startResult}
            proctor={proctor}
            onViolation={handleViolation}
            onComplete={handleComplete}
          />
        )}

        {phase === "finished" && (
          <InterviewFinished
            result={submit.data ?? null}
            loading={submit.isPending || submitting}
            terminatedReason={terminatedReason}
          />
        )}
      </main>
    </div>
  );
}

