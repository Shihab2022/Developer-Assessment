/**
 * Video-interview types: proctored AI interviews created by an organisation,
 * run by a candidate through a public link, then reviewed by the AI engine.
 *
 * Mirrors `server/prisma/schema.prisma` (Interview*, InterviewSession, ...) and
 * `server/src/modules/interviews/*`. Re-exported from `@/lib/types`.
 */

export type InterviewStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export type InterviewSessionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PROCESSING"
  | "REVIEWED"
  | "TERMINATED";

export type InterviewQuestionSource = "BANK" | "CUSTOM";

export type InterviewSeniority = "JUNIOR" | "MID" | "SENIOR" | "LEAD";

export type InterviewDecision = "STRONG_HIRE" | "HIRE" | "MAYBE" | "NO_HIRE";

export type InterviewVerdict = "EXCELLENT" | "GOOD" | "FAIR" | "WEAK" | "NO_ANSWER";

export type InterviewViolationType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FULLSCREEN_EXIT"
  | "MULTIPLE_FACES"
  | "DEVICE_DETECTED"
  | "NOISE_DETECTED"
  | "FACE_NOT_VISIBLE"
  | "CAMERA_BLOCKED"
  | "MICROPHONE_BLOCKED"
  | "LOOKING_AWAY"
  | "COPY"
  | "PASTE";

export type InterviewViolationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type InterviewViolationDetector = "CLIENT" | "AI" | "RECRUITER";

/** One technology in the server-side question bank (`GET /interviews/technologies`). */
export interface InterviewTechnologyOption {
  id: string;
  label: string;
  description: string;
  questionCount: number;
}

export interface InterviewQuestion {
  id: string;
  interviewId: string;
  order: number;
  prompt: string;
  hints: string[];
  expectedKeywords: string[];
  modelAnswer?: string | null;
  timeSeconds?: number | null;
  maxScore: number;
  source: InterviewQuestionSource;
  bankKey?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic?: string | null;
}

export interface Interview {
  id: string;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  createdBy: string;
  title: string;
  description?: string | null;
  jobRole?: string | null;
  technology: string;
  seniority: InterviewSeniority;
  questionCount: number;
  questionTimeSeconds: number;
  totalTimeSeconds?: number | null;
  shuffleQuestions: boolean;
  hintsEnabled: boolean;
  proctoringEnabled: boolean;
  terminateOnCritical: boolean;
  aiReviewEnabled: boolean;
  passScore: number;
  maxViolations: number;
  accessToken: string;
  status: InterviewStatus;
  /** When the candidate link becomes active (required at creation). */
  startsAt?: string | null;
  /** When the exam closes to candidates (required at creation). */
  expiresAt?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  /** Built by the API from `accessToken` — the shareable candidate link. */
  candidateLink?: string;
  questionTotal?: number;
  sessionTotal?: number;
  questions?: InterviewQuestion[];
  stats?: { sessionTotal: number; reviewedTotal: number; terminatedTotal: number };
}
export interface InterviewSessionSummary {
  id: string;
  token: string;
  candidateName: string;
  candidateEmail: string;
  status: InterviewSessionStatus;
  decision?: InterviewDecision | null;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passesInterview: boolean;
  integrityScore: number;
  riskLevel: string;
  violationCount: number;
  startedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;
  reviewProvider?: string | null;
  /** When the invitation email (with the secured link) was dispatched. */
  emailSentAt?: string | null;
  /** Set once the candidate proved ownership of the invited address. */
  emailVerifiedAt?: string | null;
  expiresAt?: string | null;
  /** Personal candidate link for this session (built by the API). */
  link?: string;
  answerTotal?: number;
  violationTotal?: number;
}

export interface InterviewViolation {
  id: string;
  sessionId: string;
  questionId?: string | null;
  type: InterviewViolationType;
  severity: InterviewViolationSeverity;
  detectedBy: InterviewViolationDetector;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  snapshot?: string | null;
  occurredAt: string;
}

/** Full recorded answer + AI marks (recruiter report view). */
export interface InterviewSessionAnswer {
  id: string;
  order: number;
  questionId: string;
  prompt: string;
  topic?: string | null;
  expectedKeywords: string[];
  hints: string[];
  modelAnswer?: string | null;
  timeSeconds?: number | null;
  transcript?: string | null;
  /** Set only when the organisation stores media in its own object storage. */
  recordingUrl?: string | null;
  recordingSeconds?: number | null;
  audioLevelAvg?: number | null;
  /** Small base64 evidence frames captured by the browser. */
  snapshots?: string[] | null;
  /** On-device proctoring telemetry for this question. */
  videoFrames?: Record<string, unknown> | null;
  hintsUsed: number;
  hintsRevealed: string[];
  timeSpentSeconds?: number | null;
  status: string;
  score?: number | null;
  maxScore: number;
  keywordHits: string[];
  missingKeywords: string[];
  aiFeedback?: string | null;
  aiStrengths: string[];
  aiImprovements: string[];
  aiConfidence?: number | null;
  submittedAt?: string | null;
}

export interface InterviewSessionDetail extends InterviewSessionSummary {
  candidateId?: string | null;
  candidate?: { id: string; name: string; email: string } | null;
  deviceInfo?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  aiSummary?: string | null;
  aiStrengths: string[];
  aiImprovements: string[];
  aiReview?: Record<string, unknown> | null;
}

/** Response of `GET /interviews/:id/sessions/:sessionId`. */
export interface InterviewSessionReport {
  interview: {
    id: string;
    title: string;
    technology: string;
    jobRole?: string | null;
    passScore: number;
    questionTimeSeconds: number;
    proctoringEnabled: boolean;
  };
  session: InterviewSessionDetail;
  answers: InterviewSessionAnswer[];
  violations: InterviewViolation[];
}

/** Response of `GET /interviews/:id/report`. */
export interface InterviewReport {
  interview: {
    id: string;
    title: string;
    technology: string;
    seniority: InterviewSeniority;
    status: InterviewStatus;
    questionTimeSeconds: number;
    passScore: number;
    questionTotal: number;
    candidateLink: string;
  };
  summary: {
    totalSessions: number;
    reviewed: number;
    inProgress: number;
    terminated: number;
    averagePercentage: number;
    averageIntegrity: number;
    passRate: number;
    decisionCounts: Record<string, number>;
  };
  perQuestion: {
    questionId: string;
    order: number;
    prompt: string;
    topic?: string | null;
    attempts: number;
    averageScore: number;
    maxScore: number;
    averagePercentage: number;
    averageSeconds: number;
    averageHintsUsed: number;
  }[];
  violations: {
    type: InterviewViolationType;
    count: number;
    label: string;
    severity: InterviewViolationSeverity;
  }[];
  candidates: (InterviewSessionSummary & { link: string })[];
}


/* ------------------------------------------------------------- payloads */

export interface CustomQuestionPayload {
  prompt: string;
  hints: string[];
  expectedKeywords: string[];
  modelAnswer?: string;
  timeSeconds?: number | null;
  maxScore: number;
  topic?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface CreateInterviewPayload {
  title: string;
  description?: string;
  jobRole?: string;
  technology: string;
  seniority: InterviewSeniority;
  questionCount: number;
  /** Seconds per question — defaults to 300 (5 minutes) on the server. */
  questionTimeSeconds: number;
  totalTimeSeconds?: number | null;
  shuffleQuestions: boolean;
  hintsEnabled: boolean;
  proctoringEnabled: boolean;
  terminateOnCritical: boolean;
  aiReviewEnabled: boolean;
  passScore: number;
  maxViolations: number;
  /** When the candidate link becomes active — required at creation. */
  startsAt: string;
  /** When the exam closes to candidates — required at creation. */
  expiresAt: string;
  showScoreToCandidate: boolean;
  useBankQuestions: boolean;
  customQuestions: CustomQuestionPayload[];
  companyId?: string;
}

export type UpdateInterviewPayload = Partial<
  Omit<CreateInterviewPayload, "customQuestions" | "useBankQuestions">
> & { status?: InterviewStatus };

export interface CreateSessionLinkPayload {
  candidateName: string;
  candidateEmail: string;
}

/* --------------------------------------------------------- candidate flow */

export interface PublicInterviewInfo {
  mode: "interview" | "session";
  interview: {
    id: string;
    title: string;
    description?: string | null;
    jobRole?: string | null;
    technology: string;
    seniority: InterviewSeniority;
    questionTimeSeconds: number;
    totalTimeSeconds?: number | null;
    hintsEnabled: boolean;
    passScore: number;
    startsAt?: string | null;
    expiresAt?: string | null;
    company?: { name: string; logo?: string | null } | null;
  };
  questionTotal: number;
  requiresIdentity: boolean;
  /** A personal invite link only works for its invited email (link security). */
  requiresEmailVerification?: boolean;
  emailVerified?: boolean;
  /** The masked address the invitation was sent to. */
  invitedEmail?: string | null;
  session?: {
    token: string;
    candidateName: string;
    candidateEmail: string;
    status: InterviewSessionStatus;
    startedAt?: string | null;
    expiresAt?: string | null;
    terminationReason?: string | null;
    emailVerifiedAt?: string | null;
  } | null;
  policy: {
    proctoringEnabled: boolean;
    terminateOnCritical: boolean;
    microphoneRequired: boolean;
    cameraRequired: boolean;
    fullscreenRequired: boolean;
    rules: string[];
  };
}

export interface StartSessionPayload {
  candidateName?: string;
  candidateEmail?: string;
  consentGiven: true;
  deviceInfo?: Record<string, unknown>;
}

/** A question as served to the candidate, with hints and its own timer. */
export interface InterviewRunnerQuestion {
  id: string;
  order: number;
  topic?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  source: InterviewQuestionSource;
  prompt: string;
  hints: string[];
  timeSeconds: number;
  maxScore: number;
  answer?: {
    id: string;
    status: string;
    transcript?: string | null;
    score?: number | null;
    hintsUsed: number;
  } | null;
}

export interface StartSessionResult {
  session: {
    token: string;
    status: InterviewSessionStatus;
    candidateName: string;
    candidateEmail: string;
    startedAt?: string | null;
    deadline: string;
    totalSeconds: number;
  };
  interview: PublicInterviewInfo["interview"];
  questions: InterviewRunnerQuestion[];
  policy: {
    proctoringEnabled: boolean;
    terminateOnCritical: boolean;
    maxViolations: number;
    hintsEnabled: boolean;
  };
}

export interface SessionState {
  token: string;
  status: InterviewSessionStatus;
  violationCount: number;
  integrityScore: number;
  riskLevel: string;
  terminationReason?: string | null;
}

export interface SubmitAnswerPayload {
  transcript?: string;
  recordingUrl?: string;
  recordingMime?: string;
  recordingSeconds?: number;
  audioLevelAvg?: number;
  videoFrames?: Record<string, unknown>;
  snapshots?: string[];
  hintsUsed: number;
  hintsRevealed: string[];
  timeSpentSeconds: number;
  startedAt?: string;
  status: "SUBMITTED" | "SKIPPED" | "IN_PROGRESS";
}

export interface ReportViolationPayload {
  type: InterviewViolationType;
  questionId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  snapshot?: string;
}

export interface ReportViolationResult extends SessionState {
  terminated: boolean;
  ignored?: boolean;
  severity?: InterviewViolationSeverity;
  description?: string;
  reason?: string;
}

/** Candidate-visible outcome (score hidden when the org turns it off). */
export interface InterviewSessionResult {
  token: string;
  status: InterviewSessionStatus;
  candidateName: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  terminated: boolean;
  terminationReason?: string | null;
  scoreVisible: boolean;
  totalScore?: number | null;
  maxScore?: number | null;
  percentage?: number | null;
  passes?: boolean | null;
  integrityScore: number;
  riskLevel: string;
  violationCount: number;
  summary?: string | null;
  strengths: string[];
  improvements: string[];
  decision?: InterviewDecision | null;
  reviewProvider?: string | null;
}

/* ------------------------------------------------- recruiting (invite + bank) */

/** An existing platform candidate the recruiter can invite to this interview. */
export interface InterviewCandidateOption {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  /** How many exams this person has already sat on the platform. */
  examsTaken: number;
}

export interface InterviewInviteCandidateInput {
  email: string;
  name?: string;
  /** Defaults to true on the server (the invitation email carries the link). */
  sendEmail?: boolean;
}

export interface InterviewInviteCandidatesPayload {
  candidates: InterviewInviteCandidateInput[];
}

export interface InviteCandidatesResult {
  invited: number;
  emailed: number;
  results: {
    sessionId: string;
    token: string;
    email: string;
    name: string;
    link: string;
    emailed: boolean;
    reused: boolean;
  }[];
}

/** One question from the built-in bank, browsable in the recruiter UI. */
export interface InterviewBankQuestion {
  key: string;
  topic: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  prompt: string;
  hints: string[];
  keywords: string[];
}

export interface InterviewBank {
  technology: string;
  label: string;
  total: number;
  questions: InterviewBankQuestion[];
}

/** `POST /interview-sessions/:token/verify/request` */
export interface RequestVerificationCodeResult {
  sent: boolean;
  alreadyVerified: boolean;
  email: string;
  expiresInMinutes: number;
  /** Returned only when email is disabled so local development still works. */
  devCode?: string;
}

/** `POST /interview-sessions/:token/verify/confirm` */
export interface ConfirmVerificationCodeResult {
  verified: boolean;
  email: string;
}
