import axios from "axios";
import config from "../config";

/**
 * AI review engine for video interviews.
 *
 * The candidate's browser records the video/audio, extracts a speech transcript
 * plus proctoring telemetry, and uploads them with each answer. This module turns
 * that evidence into marks and written feedback for the hiring team.
 *
 * Two interchangeable engines:
 *   1. `openai` — any OpenAI-compatible chat-completions endpoint (set AI_API_KEY).
 *   2. `rubric` — a deterministic, dependency-free rubric that runs offline, so the
 *      feature works out of the box and stays deterministic in tests.
 */

export interface ProctoringSignals {
  /** Share of sampled frames with exactly one face (0..1). */
  facePresentRatio?: number;
  /** Sampled frames where more than one person was detected. */
  multipleFaceSamples?: number;
  /** Sampled frames where a second device (phone/second screen) was seen. */
  deviceSamples?: number;
  /** Samples where ambient noise exceeded the threshold. */
  noiseSamples?: number;
  /** Frames too dark/bright to verify the candidate. */
  poorLightingSamples?: number;
}

export interface AnswerReviewInput {
  questionPrompt: string;
  hints: string[];
  expectedKeywords: string[];
  modelAnswer?: string | null;
  transcript: string;
  hintsUsed: number;
  timeSpentSeconds: number;
  timeLimitSeconds: number;
  maxScore: number;
  proctoring?: ProctoringSignals;
}

export type AnswerVerdict = "EXCELLENT" | "GOOD" | "FAIR" | "WEAK" | "NO_ANSWER";

export interface AnswerReview {
  score: number;
  maxScore: number;
  verdict: AnswerVerdict;
  feedback: string;
  strengths: string[];
  improvements: string[];
  keywordHits: string[];
  missingKeywords: string[];
  /** 0..1 — how much the reviewer trusts this mark. */
  confidence: number;
  provider: "openai" | "rubric";
}

export interface SessionReviewAnswer {
  order: number;
  prompt: string;
  transcript: string;
  hintsUsed: number;
  score: number;
  maxScore: number;
  verdict: AnswerVerdict;
  strengths: string[];
  improvements: string[];
}

export interface SessionReviewInput {
  interviewTitle: string;
  technology: string;
  candidateName: string;
  passScore: number;
  answers: SessionReviewAnswer[];
  violations: { type: string; severity: string; description?: string | null }[];
  integrityScore: number;
  terminated: boolean;
}

export type InterviewDecision = "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE";

export interface SessionReview {
  totalScore: number;
  maxScore: number;
  percentage: number;
  passes: boolean;
  decision: InterviewDecision;
  summary: string;
  strengths: string[];
  improvements: string[];
  provider: "openai" | "rubric";
}

/* ------------------------------------------------------------------ helpers */

const FILLERS = ["um", "uh", "erm", "like", "you know", "kind of", "sort of", "basically"];
const STRUCTURE_MARKERS = [
  "first",
  "then",
  "because",
  "for example",
  "however",
  "trade-off",
  "tradeoff",
  "in production",
  "i would",
  "the reason",
  "for instance",
  "so that",
  "on the other hand",
];

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value: string): string[] {
  return normalise(value).split(" ").filter(Boolean);
}

/** Keyword match that tolerates word endings ("index" also matches "indexes"). */
function matchesKeyword(haystack: string, keyword: string): boolean {
  const needle = normalise(keyword);
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  const stem = needle.replace(/(ing|es|s|ed)$/, "");
  return stem.length >= 4 && haystack.includes(stem);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function round2(value: number): number {
  return Math.round(clamp01(value) * 100) / 100;
}

function joinList(items: string[], max = 4): string {
  return items.slice(0, max).join("; ");
}


/* ------------------------------------------------------------------ rubric */

/** Deterministic offline grader — also the fallback when the LLM is unavailable. */
export function gradeAnswerWithRubric(input: AnswerReviewInput): AnswerReview {
  const transcript = (input.transcript ?? "").trim();
  const tokens = words(transcript);
  const uniqueWordCount = new Set(tokens).size;
  const haystack = normalise(transcript);

  const keywords = input.expectedKeywords ?? [];
  const keywordHits = keywords.filter((keyword) => matchesKeyword(haystack, keyword));
  const missingKeywords = keywords.filter((keyword) => !keywordHits.includes(keyword));
  const keywordCoverage = keywords.length ? keywordHits.length / keywords.length : 0;

  const fillerHits = FILLERS.filter((filler) => haystack.includes(filler)).length;
  const structureHits = STRUCTURE_MARKERS.filter((marker) => haystack.includes(marker)).length;

  // ~1.5 spoken words per second is a solid pace, so a full-budget answer
  // is expected to be a couple of hundred words long.
  const expectedWords = Math.max(60, Math.round(input.timeLimitSeconds * 1.5));
  const depth = clamp01(tokens.length / expectedWords);
  const structure = clamp01(structureHits / 4);
  const vocabulary = clamp01(uniqueWordCount / 60);
  const fillerPenalty = clamp01(fillerHits / 6) * 0.1;

  // Hints are allowed but reduce the raw credit for the answer.
  const hintPenalty = clamp01(input.hintsUsed / 3) * 0.15;
  // Answering only a small slice of the budget usually means an unfinished thought.
  const timeRatio = input.timeLimitSeconds
    ? clamp01(input.timeSpentSeconds / (input.timeLimitSeconds * 0.4))
    : 1;

  const raw =
    0.4 * keywordCoverage + 0.22 * depth + 0.16 * structure + 0.12 * vocabulary + 0.1 * timeRatio;
  const adjusted = clamp01((raw - fillerPenalty - hintPenalty) * (0.6 + 0.4 * timeRatio));

  const noAnswer = tokens.length < 5;
  const score = noAnswer ? 0 : Math.round(adjusted * input.maxScore);

  const verdict: AnswerVerdict = noAnswer
    ? "NO_ANSWER"
    : adjusted >= 0.85
      ? "EXCELLENT"
      : adjusted >= 0.65
        ? "GOOD"
        : adjusted >= 0.4
          ? "FAIR"
          : "WEAK";

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (keywordCoverage >= 0.5) {
    strengths.push(`Covered the key concepts: ${joinList(keywordHits, 5)}.`);
  } else if (keywordHits.length) {
    strengths.push(`Touched on ${joinList(keywordHits, 3)}.`);
  }
  if (structureHits >= 2) strengths.push("Structured the answer with reasoning and examples.");
  if (tokens.length >= expectedWords * 0.8) {
    strengths.push("Gave a thorough, well-developed answer.");
  }

  if (noAnswer) {
    improvements.push("No spoken answer was captured — verify the microphone before recording.");
  }
  if (missingKeywords.length) {
    improvements.push(`Did not mention: ${joinList(missingKeywords, 5)}.`);
  }
  if (!noAnswer && depth < 0.5) {
    improvements.push("The answer was brief for the time available; add depth and examples.");
  }
  if (fillerHits >= 2) {
    improvements.push('Reduce filler words ("um", "like") to sound more confident.');
  }
  if (input.hintsUsed > 0) {
    improvements.push(
      `Relied on ${input.hintsUsed} hint${input.hintsUsed > 1 ? "s" : ""}; aim to answer unaided.`,
    );
  }
  if (!noAnswer && keywordCoverage < 0.4) {
    improvements.push("Anchor the answer in the core concepts the question is testing.");
  }

  const verdictLabel =
    verdict === "EXCELLENT"
      ? "Excellent"
      : verdict === "GOOD"
        ? "Good"
        : verdict === "FAIR"
          ? "Fair"
          : "Weak";

  const feedback = noAnswer
    ? "No usable answer was recorded for this question, so no marks were awarded."
    : `${verdictLabel} answer (${score}/${input.maxScore}). ${
        keywordCoverage >= 0.5
          ? "The key concepts were covered"
          : "Several expected concepts were missing"
      }${structureHits >= 2 ? " and the reasoning was well structured." : "."} ${
        input.hintsUsed > 0 ? `Hints used: ${input.hintsUsed}.` : "No hints were used."
      }`;

  const confidence = clamp01(
    0.35 * depth + 0.4 * keywordCoverage + 0.15 * vocabulary + 0.1 * clamp01(tokens.length / 40),
  );

  return {
    score,
    maxScore: input.maxScore,
    verdict,
    feedback,
    strengths,
    improvements,
    keywordHits,
    missingKeywords,
    confidence: round2(confidence),
    provider: "rubric",
  };
}


/* ------------------------------------------------------------------- LLM */

interface LlmAnswerJson {
  score?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  keywordHits?: string[];
  missingKeywords?: string[];
  confidence?: number;
}

interface LlmSessionJson {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  decision?: string;
  performanceAdjustment?: number;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
  return items.length ? items : null;
}

/** Calls any OpenAI-compatible chat-completions endpoint and parses JSON output. */
async function askLlm(
  systemPrompt: string,
  userPrompt: string,
): Promise<Record<string, unknown> | null> {
  if (!config.ai.enabled || !config.ai.api_key) return null;
  try {
    const response = await axios.post(
      `${config.ai.base_url}/chat/completions`,
      {
        model: config.ai.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      },
      {
        timeout: config.ai.timeout_ms,
        headers: {
          Authorization: `Bearer ${config.ai.api_key}`,
          "Content-Type": "application/json",
        },
      },
    );
    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    // Network, quota or parse problems must never lose an interview — fall back.
    return null;
  }
}

const ANSWER_SYSTEM_PROMPT = [
  "You are a senior technical interviewer grading a spoken video-interview answer.",
  'Return STRICT JSON only: {"score":0-100,"feedback":"2-4 sentences","strengths":["..."],',
  '"improvements":["..."],"keywordHits":["..."],"missingKeywords":["..."],"confidence":0-1}.',
  "Judge only the transcript: technical accuracy, depth, structure and communication.",
  "Be strict but fair — an empty or off-topic answer must score below 20.",
].join(" ");

const SESSION_SYSTEM_PROMPT = [
  "You are a hiring panel summarising a proctored video interview for a recruiter.",
  'Return STRICT JSON only: {"summary":"3-5 sentences","strengths":["..."],',
  '"improvements":["..."],"decision":"STRONG_HIRE|HIRE|MAYBE|NO_HIRE"}.',
  "Base the recommendation on the per-question marks and the proctoring evidence.",
  "If integrity concerns exist, say so explicitly and never recommend a hire.",
].join(" ");

async function gradeAnswerWithLlm(input: AnswerReviewInput): Promise<AnswerReview | null> {
  const userPrompt = JSON.stringify({
    question: input.questionPrompt,
    hints: input.hints,
    expectedKeywords: input.expectedKeywords,
    referenceAnswer: input.modelAnswer ?? null,
    candidateTranscript: input.transcript || "(no speech detected)",
    hintsUsed: input.hintsUsed,
    secondsSpoken: input.timeSpentSeconds,
    timeLimitSeconds: input.timeLimitSeconds,
    maxScore: input.maxScore,
  });
  const json = (await askLlm(ANSWER_SYSTEM_PROMPT, userPrompt)) as LlmAnswerJson | null;
  if (!json || typeof json.score !== "number" || Number.isNaN(json.score)) return null;

  const rubric = gradeAnswerWithRubric(input);
  const keywords = input.expectedKeywords ?? [];
  const haystack = normalise(input.transcript ?? "");
  const ratio = clamp01(json.score / 100);

  const keywordHits =
    asStringArray(json.keywordHits) ?? keywords.filter((keyword) => matchesKeyword(haystack, keyword));
  const missingKeywords =
    asStringArray(json.missingKeywords) ??
    keywords.filter((keyword) => !keywordHits.includes(keyword));

  const noAnswer = words(input.transcript ?? "").length < 5;
  const verdict: AnswerVerdict = noAnswer
    ? "NO_ANSWER"
    : ratio >= 0.85
      ? "EXCELLENT"
      : ratio >= 0.65
        ? "GOOD"
        : ratio >= 0.4
          ? "FAIR"
          : "WEAK";

  return {
    score: noAnswer ? 0 : Math.round(ratio * input.maxScore),
    maxScore: input.maxScore,
    verdict,
    feedback:
      typeof json.feedback === "string" && json.feedback.trim() ? json.feedback.trim() : rubric.feedback,
    strengths: asStringArray(json.strengths) ?? rubric.strengths,
    improvements: asStringArray(json.improvements) ?? rubric.improvements,
    keywordHits,
    missingKeywords,
    confidence:
      typeof json.confidence === "number" ? round2(json.confidence) : rubric.confidence,
    provider: "openai",
  };
}

/** Grades one spoken answer, preferring the LLM when it is configured. */
export async function reviewAnswer(input: AnswerReviewInput): Promise<AnswerReview> {
  if (config.ai.enabled) {
    const llm = await gradeAnswerWithLlm(input);
    if (llm) return llm;
  }
  return gradeAnswerWithRubric(input);
}


/* ----------------------------------------------------------------- session */

function decisionFromPercentage(
  percentage: number,
  integrityScore: number,
  terminated: boolean,
): InterviewDecision {
  if (terminated || integrityScore < 40) return "NO_HIRE";
  // Integrity problems cap the recommendation at "MAYBE".
  if (integrityScore < 70) return percentage >= 50 ? "MAYBE" : "NO_HIRE";
  if (percentage >= 85) return "STRONG_HIRE";
  if (percentage >= 70) return "HIRE";
  if (percentage >= 50) return "MAYBE";
  return "NO_HIRE";
}

function uniquePush(target: string[], items: string[], limit = 6): void {
  for (const item of items) {
    if (target.length >= limit) return;
    if (item && !target.includes(item)) target.push(item);
  }
}

/** Deterministic session-level summary, used directly and as the LLM fallback. */
export function reviewSessionWithRubric(input: SessionReviewInput): SessionReview {
  const answers = input.answers ?? [];
  const maxScore = answers.reduce((total, answer) => total + answer.maxScore, 0);
  const answeredScore = answers.reduce((total, answer) => total + answer.score, 0);
  const totalScore = input.terminated ? 0 : answeredScore;
  const percentage = maxScore ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;
  const passes = !input.terminated && percentage >= input.passScore;

  const ranked = [...answers].sort(
    (a, b) => b.score / Math.max(1, b.maxScore) - a.score / Math.max(1, a.maxScore),
  );
  const strengths: string[] = [];
  const improvements: string[] = [];

  for (const answer of ranked.slice(0, 3)) {
    uniquePush(strengths, [...answer.strengths, ...(answer.score > 0 ? [] : [])]);
  }
  for (const answer of [...ranked].reverse().slice(0, 3)) {
    uniquePush(improvements, answer.improvements);
  }
  if (!strengths.length && percentage > 0) {
    strengths.push("Completed the interview and produced spoken answers for the panel to review.");
  }
  if (!improvements.length) {
    improvements.push("No specific weaknesses were flagged by the review engine.");
  }

  const noAnswerCount = answers.filter((answer) => answer.verdict === "NO_ANSWER").length;
  const criticalViolations = input.violations.filter((violation) => violation.severity === "CRITICAL");

  const decision = decisionFromPercentage(percentage, input.integrityScore, input.terminated);

  const parts: string[] = [];
  if (input.terminated) {
    parts.push(
      `The interview was terminated early by proctoring, so the session is scored ${totalScore}/${maxScore} and will not be considered for shortlisting.`,
    );
  } else {
    parts.push(
      `${input.candidateName} scored ${totalScore}/${maxScore} (${percentage}%) on the ${input.technology} interview "${input.interviewTitle}", across ${answers.length} question${answers.length === 1 ? "" : "s"}.`,
    );
  }
  if (noAnswerCount) {
    parts.push(
      `${noAnswerCount} question${noAnswerCount === 1 ? "" : "s"} had no usable spoken answer.`,
    );
  }
  if (input.violations.length) {
    parts.push(
      `Proctoring recorded ${input.violations.length} signal${input.violations.length === 1 ? "" : "s"}${
        criticalViolations.length ? ` (${criticalViolations.length} critical)` : ""
      }; integrity score ${input.integrityScore}/100.`,
    );
  } else {
    parts.push("No proctoring violations were recorded.");
  }
  parts.push(
    percentage >= input.passScore
      ? `The result clears the ${input.passScore}% pass mark.`
      : `The result is below the ${input.passScore}% pass mark.`,
  );

  return {
    totalScore,
    maxScore,
    percentage,
    passes,
    decision,
    summary: parts.join(" "),
    strengths,
    improvements,
    provider: "rubric",
  };
}

/** Reviews a whole session (marks + narrative + hiring recommendation). */
export async function reviewSession(input: SessionReviewInput): Promise<SessionReview> {
  const base = reviewSessionWithRubric(input);
  if (!config.ai.enabled) return base;

  const userPrompt = JSON.stringify({
    interviewTitle: input.interviewTitle,
    technology: input.technology,
    candidateName: input.candidateName,
    passScore: input.passScore,
    totalScore: base.totalScore,
    maxScore: base.maxScore,
    percentage: base.percentage,
    integrityScore: input.integrityScore,
    terminated: input.terminated,
    answers: input.answers.map((answer) => ({
      question: answer.prompt,
      transcript: answer.transcript,
      score: answer.score,
      maxScore: answer.maxScore,
      hintsUsed: answer.hintsUsed,
    })),
    proctoringViolations: input.violations,
  });

  const json = (await askLlm(SESSION_SYSTEM_PROMPT, userPrompt)) as LlmSessionJson | null;
  if (!json) return base;

  const allowed: InterviewDecision[] = ["STRONG_HIRE", "HIRE", "MAYBE", "NO_HIRE"];
  let decision = base.decision;
  if (typeof json.decision === "string" && allowed.includes(json.decision as InterviewDecision)) {
    const candidateDecision = json.decision as InterviewDecision;
    // Proctoring and integrity always win over the model's enthusiasm.
    if (!input.terminated && input.integrityScore >= 70) {
      decision = candidateDecision;
    } else if (candidateDecision === "NO_HIRE") {
      decision = "NO_HIRE";
    }
  }

  return {
    ...base,
    decision,
    summary: typeof json.summary === "string" && json.summary.trim() ? json.summary.trim() : base.summary,
    strengths: asStringArray(json.strengths) ?? base.strengths,
    improvements: asStringArray(json.improvements) ?? base.improvements,
    provider: "openai",
  };
}

