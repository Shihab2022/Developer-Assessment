/**
 * Domain types for the Developer Assessment & Coding Platform API.
 *
 * Every field here mirrors the backend exactly — either the Prisma model
 * (`server/prisma/schema.prisma`) or the `include`/`select` shape returned by
 * the corresponding service (`server/src/modules/*`). Optional (`?`) fields are
 * only used where the backend genuinely omits them depending on the endpoint.
 */

// `Result` lives in types.platform.ts but is referenced by Attempt below.
// Type-only circular imports are erased at compile time, so this is safe.
import type { Result } from "./types.platform";

// ---------------------------------------------------------------- envelope

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorField {
  field?: string;
  message: string;
}

/** Standard success envelope returned by every endpoint. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Meta;
  errors?: ApiErrorField[];
}

/** Envelope for a paginated list (data + meta are always both present). */
export interface PaginatedEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: Meta;
}

/** Convenience shape used by API modules and hooks. */
export interface Paginated<T> {
  data: T[];
  meta: Meta;
}

// ---------------------------------------------------------------- enums

export type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type CompanyMemberRole = "OWNER" | "ADMIN" | "MEMBER";

export type ProblemType = "CODING" | "MCQ" | "WRITTEN";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ACTIVE" | "CLOSED" | "ARCHIVED";
export type AssessmentAccessLevel = "PUBLIC" | "PRIVATE" | "INVITATION_ONLY" | "ACCESS_CODE";
export type ResultStrategy = "BEST_SCORE" | "LATEST_SCORE" | "FIRST_SCORE";
export type TemplateStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "COMPLETED";
export type RecruitmentStatus =
  | "INVITED"
  | "STARTED"
  | "COMPLETED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "HIRED"
  | "REJECTED";

export type AttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AUTO_SUBMITTED"
  | "EVALUATING"
  | "COMPLETED"
  | "EXPIRED";

export type SubmissionStatus =
  | "PENDING"
  | "RUNNING"
  | "PASSED"
  | "FAILED"
  | "PARTIAL"
  | "ERROR"
  | "MANUAL_REVIEW"
  | "COMPLETED";

export type EvaluationStatus = "PENDING" | "COMPLETED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
export type CreditTransactionType = "CREDIT" | "DEBIT";
export type CreditTransactionCategory =
  | "CREDIT_PURCHASE"
  | "INVITATION_USAGE"
  | "REFUND"
  | "ADMIN_ADJUSTMENT"
  | "EXPIRATION";

export type AntiCheatEventType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "FULLSCREEN_EXIT"
  | "COPY"
  | "PASTE"
  | "MULTIPLE_SESSION"
  | "SUSPICIOUS_ACTIVITY";

export type NotificationType =
  | "ASSESSMENT_INVITATION"
  | "ASSESSMENT_COMPLETED"
  | "RESULT_AVAILABLE"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ASSESSMENT_EXPIRING";

export type NotificationStatus = "UNREAD" | "READ";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

// ---------------------------------------------------------------- users & auth

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  phone?: string | null;
  bio?: string | null;
  skills?: string[];
  /** Prisma `Int?` — years of experience. */
  experience?: number | null;
  /** Free-form JSON blob on the backend. */
  education?: unknown;
  profileImageUrl?: string | null;
  resumeUrl?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Extract<Role, "CANDIDATE" | "RECRUITER">;
  phone?: string;
  companyId?: string;
}

export interface RefreshTokenPayload {
  accessToken: string;
  refreshToken: string;
}

// ---------------------------------------------------------------- companies

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  size?: string | null;
  /** Credit balance (`Company.credits`, default 0). */
  credits: number;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { members?: number; assessments?: number; problems?: number };
}

export interface CompanyMember {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyMemberRole;
  user?: Pick<User, "id" | "name" | "email" | "role" | "status" | "jobTitle">;
  createdAt?: string;
}

export interface CompanyAnalytics {
  companyId: string;
  companyName: string;
  totalAssessments: number;
  totalInvitations: number;
  completedAssessments: number;
  passRate: number;
  averageScore: number;
  candidateCount: number;
  totalAttempts: number;
  creditsConsumed: number;
  creditsRemaining: number;
  paymentTotals?: Record<string, number>;
}

export interface CompanyReportSummary {
  companyId?: string;
  companyName?: string;
  candidateCount?: number;
  completedCount?: number;
  averageScore?: number;
  passRate?: number;
  totalAssessments?: number;
  totalInvitations?: number;
  [key: string]: unknown;
}

/** Row returned by `GET /companies/:companyId/candidates`. */
export interface CompanyCandidateRow {
  invitationId: string;
  candidateId: string | null;
  candidate?: {
    id: string;
    name: string;
    email?: string;
    jobTitle?: string | null;
    profileImageUrl?: string | null;
  } | null;
  email: string;
  assessment?: { id: string; title: string } | null;
  recruitmentStatus: RecruitmentStatus;
  invitationStatus: InvitationStatus;
  invitedAt: string;
  result?: { id: string; percentage: number; passed: boolean } | null;
}

// ---------------------------------------------------------------- problems

export interface ProblemTag {
  id?: string;
  name: string;
}

export interface MCQOption {
  id?: string;
  text: string;
  isCorrect?: boolean;
  order: number;
}

export interface CodingTestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
}

/** Free-form worked examples stored in `Problem.examples`. */
export interface ProblemExample {
  input?: string;
  output?: string;
  explanation?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  type: ProblemType;
  difficulty: Difficulty;
  category?: string | null;
  points: number;
  timeLimit?: number | null;
  memoryLimit?: number | null;
  expectedAnswer?: unknown;
  createdBy: string;
  companyId?: string | null;
  status: ProblemStatus;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  skills?: string[];
  allowedLanguages?: string[];
  version?: number;
  examples?: ProblemExample[] | null;
  timesUsed?: number;
  timesAttempted?: number;
  timesSolved?: number;
  successRate?: number;
  averageScore?: number;
  /** Present on detail responses. */
  tags?: ProblemTag[];
  options?: MCQOption[];
  testCases?: CodingTestCase[];
  creator?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
  _count?: { assessmentProblems?: number; submissions?: number };
}

/** Payload accepted by `POST/PATCH /problems`. */
export interface ProblemInput {
  title: string;
  description: string;
  type: ProblemType;
  difficulty?: Difficulty;
  category?: string;
  tags?: string[];
  points?: number;
  timeLimit?: number;
  memoryLimit?: number;
  expectedAnswer?: string;
  skills?: string[];
  allowedLanguages?: string[];
  examples?: ProblemExample[];
  status?: ProblemStatus;
  options?: MCQOption[];
  testCases?: CodingTestCase[];
}

// ---------------------------------------------------------------- assessments

export interface Assessment {
  id: string;
  companyId: string;
  company?: { id: string; name: string; slug?: string } | null;
  createdBy: string;
  creator?: { id: string; name: string } | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  durationMinutes: number;
  passingScore: number;
  status: AssessmentStatus;
  startDate?: string | null;
  endDate?: string | null;
  maxAttempts: number;
  shuffleProblems: boolean;
  showResults: boolean;
  antiCheatingEnabled: boolean;
  resultStrategy: ResultStrategy;
  accessLevel: AssessmentAccessLevel;
  /** Never returned by the API — access codes are stored hashed. */
  accessCodeHash?: string | null;
  shuffleOptions: boolean;
  questionConfig?: Record<string, unknown> | null;
  templateId?: string | null;
  showCandidateRanking: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { problems?: number; invitations?: number; attempts?: number; submissions?: number };
}

export interface AssessmentInput {
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  passingScore?: number;
  startDate?: string | null;
  endDate?: string | null;
  maxAttempts?: number;
  shuffleProblems?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  antiCheatingEnabled?: boolean;
  resultStrategy?: ResultStrategy;
  accessLevel?: AssessmentAccessLevel;
  accessCode?: string;
  showCandidateRanking?: boolean;
  companyId?: string;
}

export interface AssessmentProblem {
  id: string;
  assessmentId: string;
  problemId: string;
  order: number;
  points: number;
  isRequired: boolean;
  section?: string | null;
  problem?: Problem;
}

export interface AssessmentHistoryEntry {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  actor?: { id: string; name: string; email?: string } | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

/** Response of `GET /assessments/:id/candidates/compare`. */
export interface CandidateComparisonRow {
  candidateId: string;
  candidate?: { id: string; name: string; email?: string } | null;
  earnedPoints?: number;
  totalPoints?: number;
  percentage?: number;
  passed?: boolean;
  timeTakenSeconds?: number | null;
  rank?: number | null;
  [key: string]: unknown;
}

// ---------------------------------------------------------------- invitations

export interface Invitation {
  id: string;
  assessmentId: string;
  candidateId?: string | null;
  companyId?: string | null;
  email: string;
  status: InvitationStatus;
  recruitmentStatus: RecruitmentStatus;
  invitedBy?: string | null;
  invitedAt?: string;
  expiresAt?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Present on candidate-scoped listings. */
  assessment?: {
    id: string;
    title: string;
    description?: string | null;
    instructions?: string | null;
    durationMinutes?: number;
    passingScore?: number;
    status?: AssessmentStatus;
    startDate?: string | null;
    endDate?: string | null;
    maxAttempts?: number;
    showResults?: boolean;
    company?: { id: string; name: string } | null;
  } | null;
  candidate?: { id: string; name: string; email: string } | null;
  attempts?: Attempt[];
}

export interface InviteCandidateInput {
  email: string;
  expiresAt?: string;
}

export interface InviteCandidatesPayload {
  candidates: InviteCandidateInput[];
}

export interface InviteResultRow {
  email: string;
  status?: "INVITED" | "ALREADY_INVITED" | "FAILED";
  invitation?: Invitation;
  message?: string;
  reason?: string;
}

// ---------------------------------------------------------------- attempts

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  problemId: string;
  /** MCQ answers use `{ selectedOptionId }` or `{ selectedOptionIds }`. */
  answer?: unknown;
  code?: string | null;
  programmingLanguage?: string | null;
  submittedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Attempt {
  id: string;
  assessmentId: string;
  assessment?: Assessment | null;
  candidateId: string;
  candidate?: { id: string; name: string; email: string } | null;
  companyId?: string | null;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt?: string | null;
  expiresAt?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
  answers?: AttemptAnswer[];
  result?: Result | null;
}

/** Server-authoritative timer payload from `GET /attempts/:id/time`. */
export interface AttemptTime {
  attemptId: string;
  status: AttemptStatus;
  startedAt: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  remainingTimeSeconds: number;
  serverTime: string;
}

/**
 * Question delivered to a candidate during an attempt
 * (`GET /attempts/:id/questions`). Hidden test cases are stripped server-side.
 */
export interface AttemptQuestion {
  id: string;
  problemId: string;
  order: number;
  points: number;
  isRequired: boolean;
  section?: string | null;
  problem: Problem;
}

export interface SaveAnswerPayload {
  problemId: string;
  answer?: unknown;
  code?: string;
  programmingLanguage?: string;
}

/** Response of `POST /attempts/:id/submit`. */
export interface SubmitAttemptResult {
  attemptId: string;
  status: AttemptStatus;
  submittedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
  message?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------- anti-cheating

export interface AntiCheatEvent {
  id: string;
  attemptId: string;
  eventType: AntiCheatEventType;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AntiCheatingReport {
  attemptId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  totalEvents: number;
  eventCounts: Partial<Record<AntiCheatEventType, number>>;
  uniqueIpCount: number;
  uniqueDeviceCount: number;
  sessionCount: number;
  suspiciousSessions: number;
  timeline: AntiCheatEvent[];
  note: string;
}

export interface AntiCheatEventPayload {
  eventType: AntiCheatEventType;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------- platform modules

export * from "./types.platform";

