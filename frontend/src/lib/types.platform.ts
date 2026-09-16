/**
 * Platform-module types: submissions, evaluations, results, reports/analytics,
 * payments, templates, notes, notifications, dashboards and admin.
 *
 * Mirrors `server/src/modules/*` responses and `server/prisma/schema.prisma`.
 * Re-exported from `@/lib/types`.
 */
import type {
  AttemptAnswer,
  AttemptStatus,
  EvaluationStatus,
  Meta,
  NotificationStatus,
  NotificationType,
  ProblemType,
  SubmissionStatus,
} from "./types";

// ---------------------------------------------------------------- submissions

export interface Submission {
  id: string;
  attemptId: string;
  candidateId: string;
  assessmentId: string;
  problemId: string;
  code?: string | null;
  programmingLanguage?: string | null;
  status: SubmissionStatus;
  submittedAt?: string;
  score?: number | null;
  /** Execution time in milliseconds (`Submission.executionTime`). */
  executionTime?: number | null;
  /** Memory in kilobytes (`Submission.memoryUsed`). */
  memoryUsed?: number | null;
  evaluationResult?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  problem?: { id: string; title: string; type?: ProblemType } | null;
  attempt?: { id: string; status?: AttemptStatus } | null;
  candidate?: { id: string; name: string; email?: string } | null;
  assessment?: { id: string; title: string } | null;
}

export interface CreateSubmissionPayload {
  attemptId: string;
  problemId: string;
  code: string;
  programmingLanguage: string;
}

/** Response of `POST /submissions/:id/evaluate`. */
export interface EvaluateSubmissionResult {
  submissionId?: string;
  status?: SubmissionStatus;
  score?: number | null;
  passedTests?: number;
  totalTests?: number;
  message?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------- evaluations

export interface Evaluation {
  id: string;
  submissionId?: string | null;
  attemptId: string;
  problemId: string;
  type: ProblemType;
  status: EvaluationStatus;
  score?: number | null;
  maxScore?: number | null;
  feedback?: string | null;
  evaluatorId?: string | null;
  evaluator?: { id: string; name: string; email?: string } | null;
  evaluatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  problem?: { id: string; title: string; type: ProblemType; points?: number } | null;
  attempt?: {
    id: string;
    status?: AttemptStatus;
    candidate?: { id: string; name: string; email: string } | null;
    assessment?: { id: string; title: string } | null;
    answers?: AttemptAnswer[];
  } | null;
}

export interface WrittenEvaluationPayload {
  attemptId: string;
  problemId: string;
  score: number;
  feedback?: string;
}

// ---------------------------------------------------------------- results

export interface ResultItem {
  id: string;
  resultId?: string;
  problemId: string;
  submissionId?: string | null;
  points: number;
  earnedPoints: number;
  status?: string | null;
  feedback?: string | null;
  problem?: { id: string; title: string; type: ProblemType; points?: number } | null;
}

export interface Result {
  id: string;
  attemptId: string;
  candidateId: string;
  assessmentId: string;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds?: number | null;
  releasedAt?: string | null;
  rank?: number | null;
  createdAt?: string;
  updatedAt?: string;
  /** Derived by the results service for reporting views. */
  correctAnswers?: number;
  incorrectAnswers?: number;
  assessment?: { id: string; title: string; passingScore?: number } | null;
  candidate?: { id: string; name: string; email: string } | null;
  attempt?: {
    id: string;
    status: AttemptStatus;
    score?: number | null;
    maxScore?: number | null;
    attemptNumber?: number;
    startedAt?: string | null;
    submittedAt?: string | null;
  } | null;
  items?: ResultItem[];
  evaluationFeedback?: string[];
}

export interface SkillScore {
  skill: string;
  totalPoints: number;
  earnedPoints: number;
  questions: number;
  percentage: number;
}

export interface SkillBreakdown {
  resultId: string;
  overallPercentage: number;
  passed: boolean;
  skills: SkillScore[];
}

// ---------------------------------------------------------------- reports & analytics

export interface QuestionPerformance {
  problemId: string;
  problem?: { id: string; title: string; type?: ProblemType } | null;
  title?: string;
  type?: ProblemType;
  totalPoints?: number;
  averageScore?: number;
  averagePercentage?: number;
  correctCount?: number;
  attemptedCount?: number;
  attemptsCount?: number;
  successRate?: number;
  failRate?: number;
}

export interface CandidateRankingRow {
  candidateId: string;
  candidate?: { id: string; name: string; email?: string } | null;
  candidateName?: string;
  name?: string;
  email?: string;
  earnedPoints: number;
  totalPoints: number;
  percentage: number;
  passed?: boolean;
  rank?: number;
  timeTakenSeconds?: number | null;
}

export interface AssessmentReport {
  assessmentId: string;
  assessment?: { id: string; title: string; status?: string } | null;
  totalCandidates?: number;
  candidateCount?: number;
  completedCount: number;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  passRate: number;
  averageCompletionTime?: number;
  questionPerformance?: QuestionPerformance[];
  ranking?: CandidateRankingRow[];
}

export interface ScoreDistributionBucket {
  label?: string;
  range?: string;
  count: number;
}

export interface AssessmentAnalytics {
  assessmentId: string;
  totalInvitations: number;
  startedAttempts: number;
  completedAttempts: number;
  completionRate: number;
  averageScore: number;
  medianScore: number;
  passRate: number;
  averageTimeSeconds?: number;
  averageCompletionTime?: number;
  questionPerformance?: QuestionPerformance[];
  mostFailedQuestions?: QuestionPerformance[];
  performanceDistribution?: ScoreDistributionBucket[];
  scoreDistribution?: ScoreDistributionBucket[];
}

export interface CompanyReportRow {
  id: string;
  title?: string;
  assessmentId?: string;
  completedCount?: number;
  candidateCount?: number;
  averageScore?: number;
  passRate?: number;
  createdAt?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------- payments

export interface PaymentPackage {
  id: string;
  name: string;
  credits: number;
  /** Stored as an integer amount in BDT. */
  price: number;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  userId: string;
  companyId: string;
  packageId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatusValue;
  gateway: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  package?: { id: string; name: string; credits: number } | null;
  company?: { id: string; name: string } | null;
  user?: { id: string; name: string; email: string } | null;
}

type PaymentStatusValue = import("./types").PaymentStatus;

export interface InitiatePaymentPayload {
  packageId: string;
  companyId?: string;
}

/** Response of `POST /payments/initiate`. */
export interface InitiatePaymentResult {
  payment: Payment;
  /** Present when the gateway is live. */
  gatewayUrl?: string;
  /** Present in mock mode (no SSLCommerz credentials configured). */
  mockUrl?: string;
  isMock?: boolean;
  transactionId?: string;
}

export interface CreditTransaction {
  id: string;
  companyId: string;
  userId?: string | null;
  paymentId?: string | null;
  credits: number;
  type: CreditTransactionTypeValue;
  category: CreditTransactionCategoryValue;
  description?: string | null;
  createdAt: string;
}

type CreditTransactionTypeValue = import("./types").CreditTransactionType;
type CreditTransactionCategoryValue = import("./types").CreditTransactionCategory;

// ---------------------------------------------------------------- templates

export interface AssessmentTemplate {
  id: string;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  createdBy?: string | null;
  createdByUser?: { id: string; name: string } | null;
  title: string;
  description?: string | null;
  durationMinutes: number;
  passingScore: number;
  maxAttempts: number;
  shuffleProblems: boolean;
  shuffleOptions: boolean;
  showResults: boolean;
  antiCheatingEnabled: boolean;
  resultStrategy: ResultStrategyValue;
  accessLevel: AssessmentAccessLevelValue;
  questionConfig?: Record<string, unknown> | null;
  skills: string[];
  difficultyDistribution?: Record<string, number> | null;
  antiCheatingSettings?: Record<string, unknown> | null;
  status: TemplateStatusValue;
  createdAt?: string;
  updatedAt?: string;
  _count?: { assessments?: number; usedCount?: number };
}

type ResultStrategyValue = import("./types").ResultStrategy;
type AssessmentAccessLevelValue = import("./types").AssessmentAccessLevel;
type TemplateStatusValue = import("./types").TemplateStatus;

export interface AssessmentTemplateInput {
  title: string;
  description?: string;
  durationMinutes: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleProblems?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  antiCheatingEnabled?: boolean;
  resultStrategy?: ResultStrategyValue;
  accessLevel?: AssessmentAccessLevelValue;
  questionConfig?: Record<string, unknown>;
  skills?: string[];
  difficultyDistribution?: Record<string, number>;
  antiCheatingSettings?: Record<string, unknown>;
  status?: TemplateStatusValue;
  companyId?: string;
}

// ---------------------------------------------------------------- notes

export interface Note {
  id: string;
  candidateId: string;
  assessmentId?: string | null;
  companyId?: string | null;
  authorId: string;
  author?: { id: string; name: string; email?: string } | null;
  content: string;
  isPrivate: boolean;
  createdAt?: string;
  updatedAt?: string;
  candidate?: { id: string; name: string; email: string } | null;
  assessment?: { id: string; title: string } | null;
}

export interface NoteInput {
  candidateId: string;
  assessmentId?: string;
  companyId?: string;
  content: string;
  isPrivate?: boolean;
}

export interface NoteUpdateInput {
  content?: string;
  isPrivate?: boolean;
}

// ---------------------------------------------------------------- notifications

export interface AppNotification {
  id: string;
  userId?: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationListResult {
  data: AppNotification[];
  meta: Meta;
}

export interface UnreadCountResult {
  unreadCount: number;
}

export interface MarkAllReadResult {
  updated: number;
}

// ---------------------------------------------------------------- dashboards

export interface RecruiterDashboardSummary {
  totalAssessments: number;
  activeAssessments: number;
  draftAssessments: number;
  closedAssessments: number;
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  totalResults: number;
  passedResults: number;
  passRate: number;
  completionRate: number;
  totalProblems: number;
  activeProblems: number;
  pendingEvaluations: number;
}

export interface RecruiterDashboard {
  summary: RecruiterDashboardSummary;
  recentAssessments: {
    id: string;
    title: string;
    status: import("./types").AssessmentStatus;
    createdAt: string;
  }[];
  recentResults: {
    id: string;
    percentage: number;
    passed: boolean;
    earnedPoints: number;
    totalPoints: number;
    candidate?: { id: string; name: string } | null;
    assessment?: { id: string; title: string } | null;
    createdAt: string;
  }[];
}

export interface CandidateDashboardSummary {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  totalResults: number;
  passedResults: number;
  passRate: number;
}

export interface CandidateDashboard {
  summary: CandidateDashboardSummary;
  upcomingAssessments: import("./types").Invitation[];
  recentResults: Result[];
}

// ---------------------------------------------------------------- admin

export interface AdminStats {
  totalUsers: number;
  totalCandidates: number;
  totalRecruiters: number;
  totalCompanies: number;
  totalAssessments: number;
  completedAttempts: number;
  totalPayments: number;
  totalRevenue: number;
  activeUsers: number;
  suspendedUsers: number;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  actor?: { id: string; name: string; email?: string } | null;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: import("./types").Role;
  status: import("./types").UserStatus;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  createdAt?: string;
  _count?: {
    attempts?: number;
    assessmentsCreated?: number;
    problems?: number;
    results?: number;
    invitations?: number;
  };
}

/** Aggregated shape used by the admin moderation / security consoles. */
export interface AdminSecuritySnapshot {
  suspendedUsers: number;
  deletedUsers: number;
  roleChanges: AuditLog[];
  failedLogins: AuditLog[];
  recentAuthActivity: AuditLog[];
}
