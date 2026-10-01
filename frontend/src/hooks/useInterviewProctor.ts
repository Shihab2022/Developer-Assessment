"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InterviewViolationType } from "@/lib/types";

/**
 * On-device proctoring for the video interview (requirements 4, 8, 9 and 10).
 *
 * Everything here runs in the candidate's browser:
 *   • camera + microphone acquisition and a live mic level meter,
 *   • face detection via the native `FaceDetector` API (Chrome) with a
 *     motion/brightness fallback, used to catch a second person or a second
 *     device being held up in front of the camera,
 *   • ambient-noise detection from the Web Audio analyser,
 *   • full-screen enforcement and tab/window switching,
 *   • evidence snapshots (small JPEGs) for the AI report.
 *
 * The hook never decides the outcome itself: it emits `ProctorViolation`
 * events which the runner posts to the server, where severity, integrity and
 * termination are decided (see `interviews.service.ts`).
 */

export interface ProctorViolation {
  type: InterviewViolationType;
  description?: string;
  metadata?: Record<string, unknown>;
  /** Small base64 JPEG captured at the moment of the violation. */
  snapshot?: string;
}

export interface ProctorTelemetry {
  sampledFrames: number;
  facePresentRatio: number;
  multipleFaceSamples: number;
  deviceSamples: number;
  noiseSamples: number;
  poorLightingSamples: number;
  micLevelAverage: number;
}

export type MediaStatus = "idle" | "requesting" | "ready" | "denied" | "unsupported";

interface Options {
  /** Only while the interview is actually running. */
  enabled: boolean;
  /** Throttled violation callback — the page reports it to the API. */
  onViolation: (violation: ProctorViolation) => void;
  /** Window (ms) in which one violation type can be reported at most once. */
  cooldownMs?: number;
}

interface FaceDetectionResultLike {
  boundingBox: { x: number; y: number; width: number; height: number };
}

const SAMPLE_INTERVAL_MS = 1000;
const COOLDOWN_MS = 4000;
/** Seconds without a face (but with motion) before we suspect a second device. */
const DEVICE_ABSENCE_SECONDS = 4;
/** Seconds without a face before the candidate is "not visible". */
const ABSENCE_SECONDS = 6;
/** Sustained RMS above this counts as background noise. */
const NOISE_THRESHOLD = 0.18;
const NOISE_SUSTAIN_MS = 1500;

/**
 * Grabs a small JPEG frame from the camera. Used both as evidence for the AI
 * report and as a snapshot attached to a violation event.
 * Returns `null` when the video is not ready or the frame is too large.
 */
function captureSnapshot(
  video: HTMLVideoElement | null,
  maxWidth = 480,
  quality = 0.6,
): string | null {
  if (!video || !video.videoWidth || video.readyState < 2) return null;
  try {
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    // The API rejects snapshots larger than 400 KB — drop anything bigger.
    if (dataUrl.length > 400_000) return null;
    return dataUrl;
  } catch {
    return null;
  }
}

function detectFaces(video: HTMLVideoElement): Promise<FaceDetectionResultLike[]> {
  const FaceDetectorCtor = (
    window as unknown as {
      FaceDetector?: new (options?: { maxDetectedFaces?: number; fastMode?: boolean }) => {
        detect(video: HTMLVideoElement): Promise<FaceDetectionResultLike[]>;
      };
    }
  ).FaceDetector;
  if (!FaceDetectorCtor) return Promise.reject(new Error("FaceDetector unsupported"));
  return new FaceDetectorCtor({ maxDetectedFaces: 4, fastMode: true }).detect(video);
}

export function useInterviewProctor(options: Options) {
  const { enabled, cooldownMs = COOLDOWN_MS } = options;

  const [cameraStatus, setCameraStatus] = useState<MediaStatus>("idle");
  const [micStatus, setMicStatus] = useState<MediaStatus>("idle");
  const [micLevel, setMicLevel] = useState(0);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const [inFullscreen, setInFullscreen] = useState(false);
  const [tracking, setTracking] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mutedTrackRef = useRef<MediaStreamTrack | null>(null);

  const onViolationRef = useRef(options.onViolation);
  onViolationRef.current = options.onViolation;

  const cooldowns = useRef<Record<string, number>>({});
  const counters = useRef({
    sampledFrames: 0,
    facePresentFrames: 0,
    multipleFaceSamples: 0,
    deviceSamples: 0,
    noiseSamples: 0,
    poorLightingSamples: 0,
    micLevelSum: 0,
    micLevelCount: 0,
    noFaceSinceMs: 0,
    lastMotionAtMs: 0,
    noiseSinceMs: 0,
    hasEnteredFullscreen: false,
    lastBlurAtMs: 0,
  });
  const previousFrame = useRef<{ data: Uint8ClampedArray | null; at: number }>({
    data: null,
    at: 0,
  });

  const emit = useCallback(
    (type: InterviewViolationType, description: string, metadata?: Record<string, unknown>) => {
      const now = Date.now();
      const last = cooldowns.current[type] ?? 0;
      if (now - last < cooldownMs) return;
      cooldowns.current[type] = now;
      onViolationRef.current({
        type,
        description,
        metadata,
        snapshot: captureSnapshot(videoRef.current, 480) ?? undefined,
      });
    },
    [cooldownMs],
  );

  /* ------------------------------------------------------------- devices */

  /** Requests camera + microphone permission (requirement 4). */
  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("unsupported");
      setMicStatus("unsupported");
      return false;
    }
    setCameraStatus("requesting");
    setMicStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: false },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      setCameraStatus(videoTrack ? "ready" : "denied");
      setMicStatus(audioTrack ? "ready" : "denied");

      // Mic level meter — also the source of the ambient-noise detector.
      if (audioTrack) {
        const AudioCtx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const context = new AudioCtx();
          const analyser = context.createAnalyser();
          analyser.fftSize = 1024;
          context.createMediaStreamSource(stream).connect(analyser);
          audioContextRef.current = context;
          analyserRef.current = analyser;
          mutedTrackRef.current = audioTrack;
        }
      }
      setTracking(true);
      return Boolean(videoTrack && audioTrack);
    } catch (error) {
      const name = (error as { name?: string })?.name ?? "";
      setCameraStatus(name === "NotAllowedError" ? "denied" : "denied");
      setMicStatus("denied");
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    setTracking(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    analyserRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** Small JPEG of the current frame (used as per-question evidence). */
  const takeSnapshot = useCallback(
    (maxWidth = 480) => captureSnapshot(videoRef.current, maxWidth),
    [],
  );

  /** The live camera+mic stream — used by the runner to record each answer. */
  const getStream = useCallback(() => streamRef.current, []);

  /** Asks the browser for full screen (requirement 9). */
  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        counters.current.hasEnteredFullscreen = true;
        setInFullscreen(true);
      }
    } catch {
      // Browsers may reject (user gesture required) — the violation fires later.
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      /* noop */
    }
  }, []);

  /** Aggregated telemetry uploaded with each answer for the AI report. */
  const getTelemetry = useCallback((): ProctorTelemetry => {
    const stats = counters.current;
    return {
      sampledFrames: stats.sampledFrames,
      facePresentRatio: stats.sampledFrames
        ? Math.round((stats.facePresentFrames / stats.sampledFrames) * 100) / 100
        : 0,
      multipleFaceSamples: stats.multipleFaceSamples,
      deviceSamples: stats.deviceSamples,
      noiseSamples: stats.noiseSamples,
      poorLightingSamples: stats.poorLightingSamples,
      micLevelAverage: stats.micLevelCount
        ? Math.round((stats.micLevelSum / stats.micLevelCount) * 100) / 100
        : 0,
    };
  }, []);

  const resetTelemetry = useCallback(() => {
    counters.current = {
      ...counters.current,
      sampledFrames: 0,
      facePresentFrames: 0,
      multipleFaceSamples: 0,
      deviceSamples: 0,
      noiseSamples: 0,
      poorLightingSamples: 0,
      micLevelSum: 0,
      micLevelCount: 0,
    };
  }, []);


  const [faceDetectorAvailable, setFaceDetectorAvailable] = useState(false);

  /* -------------------------------------------------- proctoring loop */

  useEffect(() => {
    if (!enabled || !tracking) return;
    const countersRef = counters.current;
    let cancelled = false;
    let sampleTimer: ReturnType<typeof setInterval> | null = null;
    let noiseSinceMs = 0;

    setFaceDetectorAvailable(
      typeof window !== "undefined" &&
        typeof (window as unknown as { FaceDetector?: unknown }).FaceDetector === "function",
    );

    const analyseFrame = async () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth) return;

      countersRef.sampledFrames += 1;

      // --- mic level + ambient noise -------------------------------------
      const analyser = analyserRef.current;
      if (analyser) {
        const buffer = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i += 1) sum += buffer[i]! * buffer[i]!;
        const rms = Math.sqrt(sum / buffer.length);
        const level = Math.min(1, rms * 4);
        setMicLevel(level);
        countersRef.micLevelSum += level;
        countersRef.micLevelCount += 1;

        if (level >= NOISE_THRESHOLD) {
          if (!noiseSinceMs) noiseSinceMs = Date.now();
          if (Date.now() - noiseSinceMs >= NOISE_SUSTAIN_MS) {
            countersRef.noiseSamples += 1;
            emit(
              "NOISE_DETECTED",
              "Sustained background noise was detected on the microphone",
              { micLevel: Math.round(level * 100) / 100, threshold: NOISE_THRESHOLD },
            );
          }
        } else {
          noiseSinceMs = 0;
        }
      }

      // --- brightness + motion (cheap 64x48 frame diff) -------------------
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 48;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(video, 0, 0, 64, 48);
      const pixels = context.getImageData(0, 0, 64, 48).data;
      const grayscale = new Uint8ClampedArray(64 * 48);
      let brightness = 0;
      for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
        const value = (pixels[i]! + pixels[i + 1]! + pixels[i + 2]!) / 3;
        grayscale[p] = value;
        brightness += value;
      }
      brightness /= grayscale.length;
      if (brightness < 45 || brightness > 230) countersRef.poorLightingSamples += 1;

      let motion = 0;
      if (previousFrame.current.data) {
        let diff = 0;
        for (let p = 0; p < grayscale.length; p += 1) {
          diff += Math.abs(grayscale[p]! - previousFrame.current.data[p]!);
        }
        motion = diff / grayscale.length;
      }
      previousFrame.current = { data: grayscale, at: Date.now() };
      if (motion > 18) countersRef.lastMotionAtMs = Date.now();

      // --- face detection (Chrome/Android `FaceDetector`) -----------------
      try {
        const faces = await detectFaces(video);
        if (cancelled) return;
        const count = faces.length;
        setFaceCount(count);
        countersRef.facePresentFrames += count >= 1 ? 1 : 0;

        if (count > 1) {
          countersRef.multipleFaceSamples += 1;
          emit("MULTIPLE_FACES", `${count} people were detected in the camera frame`, {
            faces: count,
            detector: "FaceDetector",
          });
        } else if (count === 0) {
          if (!countersRef.noFaceSinceMs) countersRef.noFaceSinceMs = Date.now();
          const withoutFaceFor = Date.now() - countersRef.noFaceSinceMs;
          const lookingAtMotion = Date.now() - countersRef.lastMotionAtMs < 1200;
          if (withoutFaceFor >= DEVICE_ABSENCE_SECONDS * 1000 && lookingAtMotion) {
            // Face lost while the frame keeps changing: someone is holding
            // something up in front of the camera (a phone / second device).
            countersRef.deviceSamples += 1;
            emit(
              "DEVICE_DETECTED",
              "A second device was detected in front of the camera",
              { secondsWithoutFace: Math.round(withoutFaceFor / 1000), detector: "FaceDetector" },
            );
          } else if (withoutFaceFor >= ABSENCE_SECONDS * 1000) {
            emit("FACE_NOT_VISIBLE", "The candidate's face left the camera frame", {
              secondsWithoutFace: Math.round(withoutFaceFor / 1000),
            });
          }
        } else {
          countersRef.noFaceSinceMs = 0;
        }
      } catch {
        // No FaceDetector in this browser: fall back to the motion heuristic so
        // requirement 8 (device use on camera) still has some coverage.
        const withoutFaceFor = countersRef.noFaceSinceMs || Date.now();
        if (!countersRef.noFaceSinceMs) {
          countersRef.noFaceSinceMs = Date.now();
          return;
        }
        const lookingAtMotion = Date.now() - countersRef.lastMotionAtMs < 1200;
        if (Date.now() - withoutFaceFor >= DEVICE_ABSENCE_SECONDS * 1000 && lookingAtMotion) {
          countersRef.deviceSamples += 1;
          emit(
            "DEVICE_DETECTED",
            "An object or second device was detected in front of the camera",
            { detector: "motion", seconds: Math.round((Date.now() - withoutFaceFor) / 1000) },
          );
        }
      }
    };

    sampleTimer = setInterval(() => {
      void analyseFrame();
    }, SAMPLE_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (sampleTimer) clearInterval(sampleTimer);
    };
  }, [enabled, tracking, emit]);

  /* ------------------------------------------------ tab / window / full screen */

  useEffect(() => {
    if (!enabled || !tracking) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        counters.current.lastBlurAtMs = Date.now();
        emit("TAB_SWITCH", "The candidate switched away from the interview tab", {
          at: new Date().toISOString(),
        });
      }
    };

    const onBlur = () => {
      const now = Date.now();
      // A hidden tab already reported a TAB_SWITCH — avoid double counting.
      if (now - counters.current.lastBlurAtMs < 3000) return;
      counters.current.lastBlurAtMs = now;
      emit("WINDOW_BLUR", "The interview window lost focus");
    };

    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setInFullscreen(active);
      if (active) {
        counters.current.hasEnteredFullscreen = true;
      } else if (counters.current.hasEnteredFullscreen) {
        emit("FULLSCREEN_EXIT", "The candidate left full-screen mode");
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [enabled, tracking, emit]);

  // Release the devices whenever the runner unmounts.
  useEffect(() => stop, [stop]);

  return {
    videoRef,
    cameraStatus,
    micStatus,
    micLevel,
    faceCount,
    faceDetectorAvailable,
    inFullscreen,
    tracking,
    start,
    stop,
    takeSnapshot,
    requestFullscreen,
    exitFullscreen,
    getTelemetry,
    resetTelemetry,
    getStream,
  };
}

