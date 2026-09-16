import type {
  Assessment,
  AssessmentAccessLevel,
  AssessmentProblem,
  AssessmentTemplateInput,
  Difficulty,
  ProblemStatus,
  ProblemType,
  RecruitmentStatus,
  ResultStrategy,
  Role,
  TemplateStatus,
  UserStatus,
} from "@/lib/types";

/** Common pagination + sort query accepted by the list endpoints. */
export interface ListParams {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

/* ---------------------------------------------------------------- users */

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  /** Prisma `Int?` — years of experience. */
  experience?: number;
  education?: unknown;
  profileImageUrl?: string;
  resumeUrl?: string;
  jobTitle?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/* ---------------------------------------------------------------- companies */

export interface CreateCompanyPayload {
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  industry?: string;
  location?: string;
  size?: string;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload>;

export interface UpdateRecruitmentStatusPayload {
  recruitmentStatus: RecruitmentStatus;
}

/* ---------------------------------------------------------------- assessments */

export interface AssessmentProblemPayload {
  problemId?: string;
  points?: number;
  isRequired?: boolean;
  section?: string;
  order?: number;
}

export interface DuplicateAssessmentPayload {
  title?: string;
  companyId?: string;
}

export interface CreateAssessmentFromTemplatePayload {
  title?: string;
  companyId?: string;
}

/* ---------------------------------------------------------------- templates */

export type CreateTemplatePayload = AssessmentTemplateInput;
export type UpdateTemplatePayload = Partial<AssessmentTemplateInput> & {
  status?: TemplateStatus;
};

/* ---------------------------------------------------------------- problems */

export interface ProblemListParams extends ListParams {
  type?: ProblemType;
  difficulty?: Difficulty;
  category?: string;
  tags?: string;
}

/* ---------------------------------------------------------------- admin */

export interface UpdateUserStatusPayload {
  status: UserStatus;
}

export interface UpdateUserRolePayload {
  role: Role;
}

export interface AuditLogParams extends ListParams {
  action?: string;
  entityType?: string;
  actorId?: string;
}

/* ---------------------------------------------------------------- filters */

export interface AssessmentListParams extends ListParams {
  companyId?: string;
}

export interface InvitationListParams extends ListParams {
  /** InvitationStatus */
  status?: string;
}

export interface AttemptListParams extends ListParams {
  /** AttemptStatus */
  status?: string;
}

export interface SubmissionListParams extends ListParams {
  problemId?: string;
}

export interface CandidateListParams extends ListParams {
  /** RecruitmentStatus */
  status?: string;
  assessmentId?: string;
}

export interface PaymentListParams extends ListParams {
  /** PaymentStatus */
  status?: string;
}

export interface NoteListParams extends ListParams {
  assessmentId?: string;
}

export interface NotificationListParams extends ListParams {
  /** NotificationStatus */
  status?: string;
}

export interface CompareCandidatesParams {
  /** Comma-separated candidate user IDs. */
  candidateIds: string;
}

/** Re-exported for convenience so consumers import filter shapes from one place. */
export type { Assessment, AssessmentProblem, ResultStrategy, AssessmentAccessLevel };
