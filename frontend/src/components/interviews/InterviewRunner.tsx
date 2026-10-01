"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Clock,
  Lightbulb,
  Mic,
  Send,
  SkipForward,
} from "lucide-react";
import { Progress } from "@/components/ui/Primitives";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { getErrorStatus, interviewSessionApi } from "@/lib/api";
import type {
  ReportViolationPayload,
  StartSessionResult,
  SubmitAnswerPayload,
} from "@/lib/types";
import type { InterviewProctor } from "./InterviewPreflight";

interface Props {
  token: string;
  start: StartSessionResult;
  proctor: InterviewProctor;
  /** Fire-and-forget proctoring report; the parent handles termination. */
  onViolation: (payload: ReportViolationPayload) => void;
  onComplete: (reason: "CANDIDATE_SUBMIT" | "TIME_EXPIRED" | "PROCTORING") => void;
}

/** Evidence frames captured per question: start, middle and end. */
const SNAPSHOTS_PER_QUESTION = 3;

export function InterviewRunner({ token, start, proctor, onViolation, onComplete }: Props) {
  const questions = start.questions;
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(questions[0]?.timeSeconds ?? 300);
  const [revealedHints, setRevealedHints] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;
  const progress = Math.round((index / total) * 100);

  const questionStartedAt = useRef<number>(Date.now());
  const snapshots = useRef<string[]>([]);
  const snapshotFlags = useRef({ start: false, middle: false });
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const keepRecognitionAlive = useRef(true);

  const indexRef = useRef(0);
  indexRef.current = index;
  const transcriptRef = useRef("");
  const revealedRef = useRef(0);
  const timeLimit = question?.timeSeconds ?? 300;

  /* --------------------------------------------------------- speech capture */

  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => never }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => never }).webkitSpeechRecognition;
    if (!SpeechRecognition) return; // Firefox/Safari: no live transcript (still recorded via telemetry)

    keepRecognitionAlive.current = true;
    const recognition = new SpeechRecognition() as unknown as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (event: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
      abort: () => void;
    };
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interimText += result[0].transcript;
      }
      if (finalText.trim()) {
        transcriptRef.current = `${transcriptRef.current} ${finalText}`.trim();
        setTranscript(transcriptRef.current);
      }
      setInterim(interimText);
    };
    recognition.onerror = () => undefined;
    // Browsers stop recognition after silence — restart while the question runs.
    recognition.onend = () => {
      if (keepRecognitionAlive.current) {
        try {
          recognition.start();
        } catch {
          /* already running */
        }
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* already running */
    }
  }, []);

  const stopRecognition = useCallback(() => {
    keepRecognitionAlive.current = false;
    try {
      recognitionRef.current?.abort();
    } catch {
      /* noop */
    }
    recognitionRef.current = null;
    setInterim("");
  }, []);

  const captureSnapshot = useCallback(() => {
    const frame = proctor.takeSnapshot(480);
    if (frame && snapshots.current.length < SNAPSHOTS_PER_QUESTION && !snapshots.current.includes(frame)) {
      snapshots.current.push(frame);
    }
  }, [proctor]);

  /* -------------------------------------------------- per-question recording */

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunks = useRef<Blob[]>([]);
  const recordingStartedAt = useRef(0);
  const [recordingActive, setRecordingActive] = useState(false);

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  /** Starts recording the answer on camera+microphone. */
  const startRecording = useCallback(() => {
    const stream = proctor.getStream();
    if (!stream || typeof MediaRecorder === "undefined") return;
    try {
      const mimeType =
        ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((value) =>
          MediaRecorder.isTypeSupported(value),
        ) ?? undefined;
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType, videoBitsPerSecond: 250_000 } : undefined,
      );
      recordingChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordingChunks.current.push(event.data);
      };
      recorder.start(1000);
      recorderRef.current = recorder;
      recordingStartedAt.current = Date.now();
      setRecordingActive(true);
    } catch {
      // Recording is optional — snapshots + transcript still feed the AI review.
      recorderRef.current = null;
      setRecordingActive(false);
    }
  }, [proctor]);

  /** Stops the recorder and returns the clip (kept only when it is small enough). */
  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return { url: null, mime: null, seconds: 0 };
    const seconds = Math.max(1, Math.round((Date.now() - recordingStartedAt.current) / 1000));
    const mime = recorder.mimeType || null;

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(recordingChunks.current, { type: mime ?? "video/webm" }));
      try {
        recorder.stop();
      } catch {
        resolve(new Blob([], { type: mime ?? "video/webm" }));
      }
    }).catch(() => null as never);

    recorderRef.current = null;
    setRecordingActive(false);
    if (!blob || blob.size === 0) return { url: null, mime, seconds };

    // Base64 inflates by ~33%; the API accepts up to 12 MB per answer, so we
    // keep clips below ~4.5 MB and always keep the snapshots + transcript.
    if (blob.size > 4_500_000) return { url: null, mime, seconds };
    try {
      const url = await blobToDataUrl(blob);
      return { url, mime, seconds };
    } catch {
      return { url: null, mime, seconds };
    }
  }, []);

  const advancing = useRef(false);

  /** Uploads the recorded answer for the current question and advances. */
  const finishQuestion = useCallback(
    async (
      status: "SUBMITTED" | "SKIPPED",
      reason: "CANDIDATE_SUBMIT" | "TIME_EXPIRED" | "PROCTORING",
    ) => {
      if (advancing.current) return;
      const currentIndex = indexRef.current;
      const current = questions[currentIndex];
      if (!current) return;
      advancing.current = true;
      setSaving(true);
      stopRecognition();
      captureSnapshot();
      const recording = await stopRecording();

      const spent = Math.max(
        1,
        Math.round((Date.now() - questionStartedAt.current) / 1000),
      );
      const payload: SubmitAnswerPayload = {
        transcript: status === "SUBMITTED" ? transcriptRef.current.trim() : "",
        recordingUrl: recording.url ?? undefined,
        recordingMime: recording.mime ?? undefined,
        recordingSeconds: recording.seconds,
        hintsUsed: revealedRef.current,
        hintsRevealed: questions[currentIndex] ? current.hints.slice(0, revealedRef.current) : [],
        timeSpentSeconds: Math.min(spent, current.timeSeconds),
        startedAt: new Date(questionStartedAt.current).toISOString(),
        snapshots: [...snapshots.current],
        videoFrames: proctor.getTelemetry(),
        status,
      };

      try {
        await interviewSessionApi.saveAnswer(token, current.id, payload);
      } catch (error) {
        // 409 = the session was terminated server-side (e.g. from another tab).
        if (getErrorStatus(error) === 409) {
          setSaving(false);
          onComplete("PROCTORING");
          return;
        }
        // A failed upload must not lose the whole interview — continue anyway.
      } finally {
        proctor.resetTelemetry();
      }

      setSaving(false);
      if (currentIndex < questions.length - 1) {
        setIndex((value) => value + 1);
        return;
      }
      setFinished(true);
      onComplete(reason);
    },
    [captureSnapshot, onComplete, proctor, questions, stopRecognition, stopRecording, token],
  );

  /** Reveals one more hint (requirement 11 — hints used reduce the mark). */
  const revealHint = () => {
    if (!question || revealedHints >= question.hints.length) return;
    const next = revealedHints + 1;
    setRevealedHints(next);
    revealedRef.current = next;
  };

  /** Copy/paste inside the interview is a recorded proctoring signal. */
  useEffect(() => {
    const inRoot = (event: Event) =>
      Boolean(
        (event.target as HTMLElement | null)?.closest?.("[data-interview-root]"),
      );
    const onCopy = (event: ClipboardEvent) => {
      if (inRoot(event)) onViolation({ type: "COPY", description: "Text copied from the interview page" });
    };
    const onPaste = (event: ClipboardEvent) => {
      if (inRoot(event)) onViolation({ type: "PASTE", description: "Text pasted into the interview page" });
    };
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [onViolation]);

  /* ------------------------------------------- per-question lifecycle + timer */

  useEffect(() => {
    const current = questions[index];
    if (!current) return;
    indexRef.current = index;
    questionStartedAt.current = Date.now();
    snapshots.current = [];
    snapshotFlags.current = { start: false, middle: false };
    transcriptRef.current = "";
    revealedRef.current = 0;
    advancing.current = false;
    setTranscript("");
    setInterim("");
    setRevealedHints(0);
    setRemaining(current.timeSeconds);
    proctor.resetTelemetry();
    captureSnapshot();
    startRecognition();
    startRecording();

    const deadline = Date.now() + current.timeSeconds * 1000;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);

      const elapsed = current.timeSeconds - left;
      if (elapsed >= Math.round(current.timeSeconds * 0.5) && !snapshotFlags.current.middle) {
        snapshotFlags.current.middle = true;
        captureSnapshot();
      }
      if (left <= 0) {
        clearInterval(timer);
        void finishQuestion("SUBMITTED", "TIME_EXPIRED");
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      stopRecognition();
      void stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!question) return null;

  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const lowTime = remaining <= 30;
  const moreHintsLeft = question.hints.length > 0 && revealedHints < question.hints.length;

  return (
    <div data-interview-root className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ------------------------------------------------------- question card */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              Question {index + 1} of {total}
              {recordingActive && (
                <Badge tone="red" size="sm">
                  ● REC
                </Badge>
              )}
            </span>
          }
          subtitle={
            <>
              {question.topic ? `${question.topic} · ` : ""}
              {question.difficulty} · {timeLimit}s budget · answer out loud
            </>
          }
          action={
            <Badge tone={lowTime ? "red" : "blue"}>
              <Clock className="size-3" />
              {clock}
            </Badge>
          }
        />
        <CardBody className="space-y-5">
          <Progress value={progress} />

          <h2 className="text-lg font-semibold leading-relaxed text-foreground">
            {question.prompt}
          </h2>

          {/* ----------------------------------------------------- hints (req 11) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Hints {revealedHints}/{question.hints.length} revealed
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={revealHint}
                disabled={!moreHintsLeft || saving}
              >
                <Lightbulb className="size-4" />
                {revealedHints === 0 ? "Show hint" : "Next hint"}
              </Button>
            </div>
            {question.hints.slice(0, revealedHints).map((hint, hintIndex) => (
              <div
                key={hint}
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              >
                <Lightbulb className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-medium">Hint {hintIndex + 1}:</span> {hint}
                </span>
              </div>
            ))}
            {revealedHints > 0 && (
              <p className="text-xs text-muted-foreground">
                Using hints reduces the mark for this answer.
              </p>
            )}
          </div>

          {/* --------------------------------------------------- live transcript */}
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Mic className="size-3.5" /> Live transcript
            </p>
            <p className="min-h-[72px] text-sm leading-relaxed text-foreground">
              {transcript || interim || (
                <span className="text-muted-foreground">
                  Speak your answer — it is transcribed as you go and reviewed by the AI.
                </span>
              )}
            </p>
          </div>


          {/* -------------------------------------------------------- actions */}
          {finished ? (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-6 text-sm font-medium text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              Answer saved — submitting your interview for the AI review…
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void finishQuestion("SKIPPED", "CANDIDATE_SUBMIT")}
                disabled={saving}
              >
                <SkipForward className="size-4" />
                Skip question
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => void finishQuestion("SUBMITTED", "CANDIDATE_SUBMIT")}
                  disabled={saving}
                >
                  Save answer
                </Button>
                <Button
                  onClick={() => void finishQuestion("SUBMITTED", "CANDIDATE_SUBMIT")}
                  disabled={saving}
                  loading={saving}
                >
                  {isLast ? "Finish the interview" : "Next question"}
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---------------------------------------------------------- proctor HUD */}
      <aside className="space-y-4">
        <Card>
          <CardBody className="space-y-3">
            <video
              ref={proctor.videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-video w-full rounded-lg bg-black object-cover"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Camera: {proctor.cameraStatus === "ready" ? "on" : "blocked"}</span>
              <span>Mic: {proctor.micStatus === "ready" ? "on" : "blocked"}</span>
              <span>
                Faces: {proctor.faceDetectorAvailable ? (proctor.faceCount ?? "—") : "n/a"}
              </span>
            </div>
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                Input level
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary-600 transition-[width] duration-150"
                  style={{ width: `${Math.round(proctor.micLevel * 100)}%` }}
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Proctoring active" />
          <CardBody className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p className="flex items-center gap-2">
              <Camera className="size-3.5" /> Full screen:{" "}
              {proctor.inFullscreen ? "on" : "off"}
            </p>
            <p>
              Switching tabs or windows, leaving full screen, a second person, a second device or
              loud background noise ends the interview immediately — the session is suspended and
              scored 0.
            </p>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}


