// ---------- API envelope ----------
export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Meta;
  errors?: { field?: string; message: string }[];
}

// ---------- Users / Auth ----------
export type Role = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone?: string | null;
  bio?: string | null;
  skills?: string[];
  profileImageUrl?: string | null;
  resumeUrl?: string | null;
  jobTitle?: string | null;
  experience?: unknown;
  education?: unknown;
  companyId?: string | null;
  createdAt?: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  ipAddress?: string | null;
}

// ---------- Companies ----------
export interface Company {
  id: string;
  name: string;
  logo?: string | null;
  description?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  size?: string | null;
  creditBalance?: number;
  createdAt?: string;
  deletedAt?: string | null;
  _count?: { members?: number; assessments?: number };
}

export interface CompanyMember {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: User;
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
  paymentTotals?: Record<string, unknown>;
}

export interface CandidateRow {
  invitationId: string;
  candidateId: string;
  candidate?: { id: string; name: string; email?: string; jobTitle?: string | null };
  email: string;
  assessment?: { id: string; title: string };
  recruitmentStatus: string;
  invitationStatus: string;
  invitedAt: string;
  result?: { id: string; percentage: number; passed: boolean } | null;
}

// ---------- Problems ----------
export type ProblemType = "CODING" | "MCQ" | "WRITTEN";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProblemStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

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

export interface Problem {
  id: string;
  title: string;
  description: string;
  type: ProblemType;
  difficulty: Difficulty;
  category?: string | null;
  tags?: { id: string; name: string }[] | string[];
  skills?: string[];
  points: number;
  status: ProblemStatus;
  companyId?: string | null;
  createdBy?: string;
  timeLimit?: number | null;
  memoryLimit?: number | null;
  allowedLanguages?: string[];
  expectedAnswer?: string | null;
  examples?: { input: string; output: string; explanation?: string }[];
  options?: MCQOption[];
  testCases?: CodingTestCase[];
  createdAt?: string;
}

// ---------- Assessments ----------
export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ACTIVE" | "CLOSED" | "ARCHIVED";

export interface Assessment {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  status: AssessmentStatus;
  durationMinutes: number;
  passingScore?: number;
  startDate?: string | null;
  endDate?: string | null;
  maxAttempts: number;
  shuffleProblems?: boolean;
  shuffleOptions?: boolean;
  showResults?: boolean;
  antiCheatingEnabled?: boolean;
  showCandidateRanking?: boolean;
  resultStrategy?: "LATEST_SCORE" | "BEST_SCORE" | "AVERAGE_SCORE";
  accessLevel?: "PUBLIC" | "INVITATION_ONLY";
  companyId?: string | null;
  company?: { id: string; name: string };
  createdBy?: string;
  createdAt?: string;
  _count?: { problems?: number; invitations?: number; attempts?: number };
}

export interface AssessmentProblem {
  id: string;
  assessmentId: string;
  problemId: string;
  points: number;
  order: number;
  section?: string | null;
  isRequired: boolean;
  problem: Problem;
}

export interface AssessmentHistoryEntry {
  id: string;
  action: string;
  createdAt: string;
  actor?: { id: string; name: string } | null;
  metadata?: Record<string, unknown>;
}

// ---------- Invitations ----------
export type InvitationStatus = "PENDING" | "ACCEPTED" | "COMPLETED" | "REJECTED" | "EXPIRED";

export interface Invitation {
  id: string;
  assessmentId: string;
  candidateId?: string | null;
  email: string;
  status: InvitationStatus;
  expiresAt?: string | null;
  acceptedAt?: string | null;
  recruitmentStatus?: string;
  createdAt?: string;
  assessment?: {
    id: string;
    title: string;
    description?: string | null;
    durationMinutes?: number;
    status?: AssessmentStatus;
    startDate?: string | null;
    endDate?: string | null;
    company?: { id: string; name: string };
  };
}

// ---------- Attempts ----------
export type AttemptStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "AUTO_SUBMITTED"
  | "EVALUATING"
  | "COMPLETED"
  | "EXPIRED";

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  problemId: string;
  answer?: unknown;
  code?: string | null;
  programmingLanguage?: string | null;
  submittedAt?: string;
}

export interface Attempt {
  id: string;
  assessmentId: string;
  candidateId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt?: string | null;
  expiresAt?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  maxScore?: number | null;
  answers?: AttemptAnswer[];
  assessment?: Assessment | { id: string; title?: string; durationMinutes?: number; antiCheatingEnabled?: boolean };
}

export interface AttemptTime {
  attemptId: string;
  status: AttemptStatus;
  startedAt: string | null;
  expiresAt: string | null;
  submittedAt: string | null;
  remainingTimeSeconds: number;
  serverTime: string;
}

export type AntiCheatEventType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "WINDOW_FOCUS"
  | "FULLSCREEN_EXIT"
  | "COPY"
  | "PASTE"
  | "MULTIPLE_SESSION"
  | "SUSPICIOUS_ACTIVITY";

export interface AntiCheatEvent {
  id: string;
  eventType: AntiCheatEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export * from "./types.platform";


