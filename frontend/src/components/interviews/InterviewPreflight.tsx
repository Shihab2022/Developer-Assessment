"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Monitor,
  ShieldAlert,
  Video,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Primitives";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { useConfirmInterviewCode, useRequestInterviewCode } from "@/hooks/useInterviewSession";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PublicInterviewInfo } from "@/lib/types";

export interface InterviewProctor {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraStatus: string;
  micStatus: string;
  micLevel: number;
  faceCount: number | null;
  faceDetectorAvailable: boolean;
  inFullscreen: boolean;
  tracking: boolean;
  start: () => Promise<boolean>;
  stop: () => void;
  takeSnapshot: (maxWidth?: number) => string | null;
  requestFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  getTelemetry: () => {
    sampledFrames: number;
    facePresentRatio: number;
    multipleFaceSamples: number;
    deviceSamples: number;
    noiseSamples: number;
    poorLightingSamples: number;
    micLevelAverage: number;
  };
  resetTelemetry: () => void;
  getStream: () => MediaStream | null;
}

interface Props {
  info: PublicInterviewInfo;
  proctor: InterviewProctor;
  starting: boolean;
  onStart: (identity: { candidateName?: string; candidateEmail?: string }) => void;
}

/**
 * Requirement 4: opening the link triggers the camera + microphone permission
 * prompt, and requirement 9's full-screen/proctoring rules are consented to
 * before the first question is served.
 */
export function InterviewPreflight({ info, proctor, starting, onStart }: Props) {
  const [name, setName] = useState(info.session?.candidateName ?? "");
  const [email, setEmail] = useState(info.session?.candidateEmail ?? "");
  const [consent, setConsent] = useState(false);
  const [requested, setRequested] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /** Link security: prove you own the address the invitation was sent to. */
  const token = info.session?.token ?? "";
  const requestCode = useRequestInterviewCode(token);
  const confirmCode = useConfirmInterviewCode(token);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(Boolean(info.session?.emailVerifiedAt));
  const [devCode, setDevCode] = useState<string | undefined>(undefined);

  const needsEmailVerification = Boolean(info.requiresEmailVerification);

  const cameraReady = proctor.cameraStatus === "ready";
  const micReady = proctor.micStatus === "ready";
  const devicesReady = cameraReady && micReady;

  useEffect(() => {
    // Ask for the camera/microphone as soon as the page opens (requirement 4).
    if (!requested) {
      setRequested(true);
      void proctor.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Personal links: send the one-time code automatically so the candidate can
    // prove ownership of the invited mailbox before starting (requirement 5).
    if (needsEmailVerification && token && !codeSent && !requestCode.isPending) {
      requestCode.mutate(undefined, {
        onSuccess: (result) => {
          setCodeSent(true);
          setDevCode(result.devCode);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsEmailVerification, token]);

  const verifying = requestCode.isPending || confirmCode.isPending;

  const handleVerify = () => {
    if (code.trim().length !== 6) return;
    confirmCode.mutate(code.trim());
  };

  const canSubmit = useMemo(() => {
    if (!devicesReady || !consent || starting) return false;
    if (needsEmailVerification) return false;
    if (!info.requiresIdentity) return true;
    return Boolean(name.trim() && email.trim());
  }, [devicesReady, consent, starting, info.requiresIdentity, name, email, needsEmailVerification]);

  const requestDevices = async () => {
    setLocalError(null);
    const ok = await proctor.start();
    if (!ok) {
      setLocalError(
        "Camera and microphone access was blocked. Allow them in your browser's address bar, then try again.",
      );
    }
  };

  const handleStart = async () => {
    if (!canSubmit) return;
    await proctor.requestFullscreen();
    onStart({
      candidateName: info.requiresIdentity ? name.trim() : undefined,
      candidateEmail: info.requiresIdentity ? email.trim() : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardHeader
          icon={<Video className="size-4" />}
          title={info.interview.title}
          subtitle={
            <>
              {info.interview.company?.name ? `${info.interview.company.name} · ` : ""}
              {info.interview.technology.toUpperCase()} · {info.questionTotal} questions ·{" "}
              {Math.round(info.interview.questionTimeSeconds / 60)} min each
            </>
          }
          action={
            <Badge tone={proctor.inFullscreen ? "green" : "amber"}>
              <ShieldAlert className="size-3" />
              {info.policy.proctoringEnabled ? "Proctored" : "Standard"}
            </Badge>
          }
        />
        <CardBody className="space-y-5">
          {info.interview.description && (
            <p className="text-sm text-muted-foreground">{info.interview.description}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            {/* Live preview so the candidate can check the framing. */}
            <div className="relative overflow-hidden rounded-xl border border-border bg-black">
              <video
                ref={proctor.videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-3 py-2 text-[11px] text-white">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", cameraReady ? "bg-emerald-400" : "bg-rose-400")}
                  />
                  Camera {cameraReady ? "on" : "off"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", micReady ? "bg-emerald-400" : "bg-rose-400")}
                  />
                  Microphone {micReady ? "on" : "off"}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <span className="flex items-center gap-2">
                {cameraReady ? (
                  <Camera className="size-4 text-emerald-600" />
                ) : (
                  <CameraOff className="size-4 text-rose-600" />
                )}
                Camera {cameraReady ? "ready" : "not ready"}
              </span>
              <span className="flex items-center gap-2">
                {micReady ? (
                  <Mic className="size-4 text-emerald-600" />
                ) : (
                  <MicOff className="size-4 text-rose-600" />
                )}
                Microphone {micReady ? "ready" : "not ready"}
              </span>
              <span className="flex items-center gap-2">
                <Monitor className="size-4 text-muted-foreground" />
                Face detector: {proctor.faceDetectorAvailable ? "available" : "motion fallback"}
              </span>

              <div>
                <Label htmlFor="mic-level">Input level</Label>
                <div id="mic-level" className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary-600 transition-[width] duration-150"
                    style={{ width: `${Math.round(proctor.micLevel * 100)}%` }}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={requestDevices}
                disabled={proctor.cameraStatus === "requesting"}
              >
                <Camera className="size-4" />
                {devicesReady ? "Check devices again" : "Request camera & microphone"}
              </Button>
            </div>
          </div>

          {localError && (
            <Alert variant="destructive">
              <AlertTitle>Device access required</AlertTitle>
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}


          {/* -------- proctoring rules — requirement 9 -------- */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="mb-2 font-semibold">Before you begin</p>
            <ul className="list-disc space-y-1 pl-5">
              {info.policy.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>

          {info.requiresIdentity && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="candidate-name">Your name</Label>
                <Input
                  id="candidate-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Candidate"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="candidate-email">Your email</Label>
                <Input
                  id="candidate-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="jane@example.com"
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          {needsEmailVerification && (
            <div className="space-y-3 rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm dark:border-primary-800 dark:bg-primary-950/40">
              <p className="font-semibold text-primary-900 dark:text-primary-100">
                Verify it&apos;s you before starting
              </p>
              <p className="text-primary-900/80 dark:text-primary-100/90">
                This personal link belongs to{" "}
                <span className="font-medium">
                  {info.invitedEmail ?? info.session?.candidateEmail}
                </span>
                . We send a 6-digit code to that inbox — only the owner of this address can take
                this interview.
              </p>

              {devCode && (
                <p className="rounded-md bg-amber-100 px-3 py-2 text-xs text-amber-900">
                  Email is disabled in this environment — your code is{" "}
                  <strong className="font-mono tracking-wider">{devCode}</strong>.
                </p>
              )}

              <div className="flex flex-wrap items-end gap-2">
                <div className="w-44">
                  <Label htmlFor="verify-code">6-digit code</Label>
                  <Input
                    id="verify-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="font-mono tracking-[0.4em]"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleVerify();
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleVerify}
                  disabled={code.length !== 6 || verifying}
                  loading={verifying}
                >
                  Verify email
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => requestCode.mutate()}
                  disabled={requestCode.isPending}
                >
                  {codeSent ? "Resend code" : "Send code"}
                </Button>
              </div>

              {confirmCode.isError && (
                <p className="text-xs font-medium text-destructive">
                  {getErrorMessage(confirmCode.error)}
                </p>
              )}
              {!codeSent && requestCode.isPending && (
                <p className="text-xs text-primary-800/80">Sending your code…</p>
              )}
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary-600"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            <span>
              I agree to be recorded (camera and microphone), to stay in full screen, and to the
              anti-cheating policy. Any violation of the rules above ends the interview immediately
              and my session is suspended with a score of 0.
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {info.questionTotal} questions · hints available ·{" "}
              {Math.round(info.interview.questionTimeSeconds / 60)} minutes per question
            </p>
            <Button size="lg" onClick={handleStart} disabled={!canSubmit} loading={starting}>
              Start the interview
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

