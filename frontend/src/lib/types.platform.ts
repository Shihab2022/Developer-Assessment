import type { AttemptAnswer, ProblemType, AttemptStatus } from "./types";

// ---------- Submissions ----------
export type SubmissionStatus =
  | "PENDING"
  | "RUNNING"
  | "PASSED"
  | "FAILED"
  | "PARTIAL"
  | "ERROR"
  | "MANUAL_REVIEW";

export interface Submission {
  id: string;
  attemptId: string;
  problemId: string;
  code: string;
  programmingLanguage: string;
  status: SubmissionStatus;
  executionTimeMs?: number | null;
  memoryUsedMb?: number | null;
  createdAt?: string;
  problem?: { id: string; title: string };
}

// ---------- Evaluations ----------
export type EvaluationStatus = "PENDING" | "COMPLETED";

export interface Evaluation {
  id: string;
  attemptId: string;
  problemId: string;
  type: ProblemType;
  score: number;
  maxScore: number;
  status: EvaluationStatus;
  feedback?: string | null;
  evaluatedAt?: string | null;
  createdAt?: string;
  problem?: { id: string; title: string; type: ProblemType };
  evaluator?: { id: string; name: string } | null;
  attempt?: {
    id: string;
    candidate?: { id: string; name: string; email: string };
    assessment?: { id: string; title: string };
    answers?: AttemptAnswer[];
  };
}

// ---------- Results ----------
export interface ResultItem {
  id: string;
  problemId: string;
  points: number;
  earnedPoints: number;
  status?: string;
  feedback?: string | null;
  problem?: { id: string; title: string; type: ProblemType; points: number };
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
  correctAnswers?: number;
  incorrectAnswers?: number;
  releasedAt?: string | null;
  createdAt?: string;
  assessment?: { id: string; title: string };
  candidate?: { id: string; name: string; email: string };
  attempt?: {
    id: string;
    status: AttemptStatus;
    score?: number | null;
    maxScore?: number | null;
    startedAt?: string | null;
    submittedAt?: string | null;
  } | null;
  items?: ResultItem[];
}

export interface SkillBreakdown {
  resultId: string;
  overallPercentage: number;
  passed: boolean;
  skills: {
    skill: string;
    totalPoints: number;
    earnedPoints: number;
    questions: number;
    percentage: number;
  }[];
}

// ---------- Reports & Analytics ----------
export interface QuestionPerformance {
  problemId: string;
  title?: string;
  type?: ProblemType;
  totalPoints?: number;
  averageScore?: number;
  averagePercentage?: number;
  correctCount?: number;
  attemptedCount?: number;
  attemptsCount?: number;
  successRate?: number;
}

export interface AssessmentReport {
  assessmentId: string;
  totalCandidates?: number;
  candidateCount?: number;
  completedCount: number;
  averageScore?: number;
  highestScore?: number;
  lowestScore?: number;
  passRate: number;
  averageCompletionTime?: number;
  questionPerformance?: QuestionPerformance[];
  ranking?: {
    candidateId: string;
    candidateName?: string;
    name?: string;
    email?: string;
    earnedPoints: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    timeTakenSeconds?: number | null;
  }[];
}

export interface AssessmentAnalytics {
  assessmentId: string;
  totalInvitations?: number;
  startedAttempts?: number;
  completedAttempts?: number;
  completionRate?: number;
  averageScore?: number;
  medianScore?: number;
  passRate?: number;
  averageTime?: number;
  questionPerformance?: QuestionPerformance[];
  mostFailedQuestions?: QuestionPerformance[];
  performanceDistribution?: { range: string; count: number }[];
  scoreDistribution?: { range: string; count: number }[];
}

// ---------- Payments ----------
export interface PaymentPackage {
  id: string;
  name: string;
  description?: string | null;
  credits: number;
  price: number;
  currency?: string;
  isPopular?: boolean;
  isActive?: boolean;
}

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface Payment {
  id: string;
  transactionId?: string;
  amount: number;
  credits?: number;
  currency?: string;
  status: PaymentStatus;
  companyId?: string;
  packageId?: string;
  packageName?: string;
  createdAt?: string;
  company?: { id: string; name: string };
}

// ---------- Templates ----------
export interface AssessmentTemplate {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleProblems?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  antiCheatingEnabled?: boolean;
  resultStrategy?: string;
  accessLevel?: string;
  skills?: string[];
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  companyId?: string | null;
  createdAt?: string;
  _count?: { usedCount?: number };
}

// ---------- Notes ----------
export interface Note {
  id: string;
  candidateId: string;
  assessmentId?: string | null;
  companyId?: string | null;
  content: string;
  isPrivate: boolean;
  createdAt?: string;
  author?: { id: string; name: string } | null;
  authorId?: string;
}

// ---------- Notifications ----------
export type NotificationType =
  | "ASSESSMENT_INVITATION"
  | "ASSESSMENT_COMPLETED"
  | "RESULT_AVAILABLE"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ASSESSMENT_EXPIRING";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  status: "UNREAD" | "READ";
  createdAt: string;
  link?: string | null;
}

// ---------- Dashboards ----------
export interface RecruiterDashboard {
  summary: {
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
  };
  recentAssessments: { id: string; title: string; status: AssessmentStatus; createdAt: string }[];
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

export interface CandidateDashboard {
  summary: {
    totalInvitations: number;
    pendingInvitations: number;
    acceptedInvitations: number;
    totalAttempts: number;
    completedAttempts: number;
    inProgressAttempts: number;
    totalResults: number;
    passedResults: number;
    passRate: number;
  };
  upcomingAssessments: import("./types").Invitation[];
  recentResults: Result[];
}

// ---------- Admin ----------
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
  entityType: string;
  entityId?: string;
  actorId?: string;
  actor?: { id: string; name: string; email?: string } | null;
  ipAddress?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

import type { AssessmentStatus } from "./types";
export type { AssessmentStatus };



