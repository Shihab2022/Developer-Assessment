import type { AssessmentStatus, Role } from "./types";

/* ------------------------------------------------------------------ enums
 * These mirror `server/prisma/schema.prisma` exactly. They are the single
 * source of truth for select options, filters and label rendering.
 * ------------------------------------------------------------------------ */

export const ROLES = ["CANDIDATE", "RECRUITER", "ADMIN"] as const;
export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "DELETED"] as const;
export const COMPANY_MEMBER_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

export const PROBLEM_TYPES = ["CODING", "MCQ", "WRITTEN"] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const PROBLEM_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

/** DRAFT -> PUBLISHED -> ACTIVE -> CLOSED -> ARCHIVED (ARCHIVED -> DRAFT via restore). */
export const ASSESSMENT_STATUSES = ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"] as const;
export const ASSESSMENT_ACCESS_LEVELS = ["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"] as const;
export const RESULT_STRATEGIES = ["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"] as const;
export const TEMPLATE_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const INVITATION_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED", "COMPLETED"] as const;
export const RECRUITMENT_STATUSES = [
  "INVITED",
  "STARTED",
  "COMPLETED",
  "SHORTLISTED",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
] as const;

export const ATTEMPT_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "AUTO_SUBMITTED",
  "EVALUATING",
  "COMPLETED",
  "EXPIRED",
] as const;

export const SUBMISSION_STATUSES = [
  "PENDING",
  "RUNNING",
  "PASSED",
  "FAILED",
  "PARTIAL",
  "ERROR",
  "MANUAL_REVIEW",
  "COMPLETED",
] as const;

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "CANCELLED", "REFUNDED"] as const;

export const ANTI_CHEAT_EVENT_TYPES = [
  "TAB_SWITCH",
  "WINDOW_BLUR",
  "WINDOW_FOCUS",
  "FULLSCREEN_EXIT",
  "COPY",
  "PASTE",
  "MULTIPLE_SESSION",
  "SUSPICIOUS_ACTIVITY",
] as const;

export const NOTIFICATION_TYPES = [
  "ASSESSMENT_INVITATION",
  "ASSESSMENT_COMPLETED",
  "RESULT_AVAILABLE",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "ASSESSMENT_EXPIRING",
] as const;

export const NOTIFICATION_STATUSES = ["UNREAD", "READ"] as const;

/* ------------------------------------------------------------------ labels */

export const ROLE_LABELS: Record<Role, string> = {
  CANDIDATE: "Candidate",
  RECRUITER: "Recruiter",
  ADMIN: "Administrator",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  CODING: "Coding",
  MCQ: "Multiple choice",
  WRITTEN: "Written",
};

export const ACCESS_LEVEL_LABELS: Record<string, string> = {
  PUBLIC: "Public — anyone with the link",
  INVITATION_ONLY: "Invitation only",
  PRIVATE: "Private — company members",
  ACCESS_CODE: "Requires an access code",
};

export const RESULT_STRATEGY_LABELS: Record<string, string> = {
  LATEST_SCORE: "Use the latest attempt score",
  BEST_SCORE: "Use the best attempt score",
  FIRST_SCORE: "Use the first attempt score",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const ANTI_CHEAT_LABELS: Record<string, string> = {
  TAB_SWITCH: "Tab switch",
  WINDOW_BLUR: "Window blurred",
  WINDOW_FOCUS: "Window focused",
  FULLSCREEN_EXIT: "Fullscreen exited",
  COPY: "Copy",
  PASTE: "Paste",
  MULTIPLE_SESSION: "Multiple sessions",
  SUSPICIOUS_ACTIVITY: "Suspicious activity",
};

export const NOTIFICATION_ICONS: Record<string, string> = {
  ASSESSMENT_INVITATION: "📩",
  ASSESSMENT_COMPLETED: "✅",
  RESULT_AVAILABLE: "🏁",
  PAYMENT_SUCCESS: "💳",
  PAYMENT_FAILED: "⚠️",
  ASSESSMENT_EXPIRING: "⏰",
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  LOW: "Low risk",
  MEDIUM: "Medium risk",
  HIGH: "High risk",
};

/* ------------------------------------------------------- badge tone mapping */

export type BadgeTone =
  | "gray"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "indigo"
  | "slate";

/** Maps any backend enum value to a semantic badge tone. */
export const STATUS_TONES: Record<string, BadgeTone> = {
  // Assessment lifecycle
  DRAFT: "gray",
  PUBLISHED: "blue",
  ACTIVE: "green",
  CLOSED: "amber",
  ARCHIVED: "slate",
  // Attempt lifecycle
  NOT_STARTED: "gray",
  IN_PROGRESS: "blue",
  SUBMITTED: "indigo",
  AUTO_SUBMITTED: "amber",
  EVALUATING: "amber",
  COMPLETED: "green",
  EXPIRED: "gray",
  // Submission lifecycle
  RUNNING: "blue",
  PASSED: "green",
  FAILED: "red",
  PARTIAL: "amber",
  ERROR: "red",
  MANUAL_REVIEW: "violet",
  // Invitations
  PENDING: "amber",
  ACCEPTED: "blue",
  REJECTED: "red",
  // Recruitment pipeline
  INVITED: "gray",
  STARTED: "blue",
  SHORTLISTED: "violet",
  INTERVIEW: "blue",
  HIRED: "green",
  // Difficulty
  EASY: "green",
  MEDIUM: "amber",
  HARD: "red",
  // Problem types
  CODING: "indigo",
  MCQ: "blue",
  WRITTEN: "violet",
  // Payments
  PAID: "green",
  CANCELLED: "gray",
  REFUNDED: "violet",
  // Users
  SUSPENDED: "red",
  DELETED: "gray",
  // Notifications
  UNREAD: "blue",
  READ: "gray",
  // Risk
  LOW: "green",
  HIGH: "red",
};

/* ------------------------------------------------------- code execution */

export interface LanguageOption {
  value: string;
  label: string;
  /** Monaco language id. */
  monaco: string;
  /** Starter template inserted into the editor. */
  template: string;
}

export const PROGRAMMING_LANGUAGES: LanguageOption[] = [
  {
    value: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    template: "function solution(input) {\n  // your code here\n}\n",
  },
  {
    value: "typescript",
    label: "TypeScript",
    monaco: "typescript",
    template: "function solution(input: string): string {\n  // your code here\n  return input;\n}\n",
  },
  {
    value: "python",
    label: "Python",
    monaco: "python",
    template: "def solution(data):\n    # your code here\n    pass\n",
  },
  {
    value: "java",
    label: "Java",
    monaco: "java",
    template: "public class Solution {\n    public static void main(String[] args) {\n        // your code here\n    }\n}\n",
  },
  {
    value: "cpp",
    label: "C++",
    monaco: "cpp",
    template: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // your code here\n    return 0;\n}\n",
  },
  {
    value: "csharp",
    label: "C#",
    monaco: "csharp",
    template: "using System;\n\nclass Solution {\n    static void Main() {\n        // your code here\n    }\n}\n",
  },
  {
    value: "go",
    label: "Go",
    monaco: "go",
    template: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"hello\")\n}\n",
  },
  {
    value: "rust",
    label: "Rust",
    monaco: "rust",
    template: "fn main() {\n    // your code here\n}\n",
  },
  {
    value: "php",
    label: "PHP",
    monaco: "php",
    template: "<?php\nfunction solution($input) {\n    // your code here\n}\n",
  },
  {
    value: "ruby",
    label: "Ruby",
    monaco: "ruby",
    template: "def solution(input)\n  # your code here\nend\n",
  },
  {
    value: "sql",
    label: "SQL",
    monaco: "sql",
    template: "SELECT *\nFROM table_name\nWHERE condition;\n",
  },
  {
    value: "html",
    label: "HTML",
    monaco: "html",
    template:
      "<!DOCTYPE html>\n<html lang=\"en\">\n  <body>\n    <h1>Hello, world!</h1>\n  </body>\n</html>\n",
  },
  {
    value: "css",
    label: "CSS",
    monaco: "css",
    template: "body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}\n",
  },
];

export const DEFAULT_LANGUAGE = PROGRAMMING_LANGUAGES[0]!;

export function languageLabel(value?: string | null): string {
  if (!value) return "—";
  return PROGRAMMING_LANGUAGES.find((lang) => lang.value === value)?.label ?? value;
}

/* ------------------------------------------------------- app metadata */

export const APP_NAME = "DevAssess";
export const APP_TAGLINE = "Assessment & coding platform for engineering hiring";
export const APP_DESCRIPTION =
  "Build coding, multiple-choice and written assessments, invite candidates, run server-timed attempts with proctoring signals, and evaluate results with per-skill analytics.";

/* ------------------------------------------------------- navigation */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** Optional live counter rendered as a badge by AppShell. */
  badge?: "pendingEvaluations" | "pendingInvitations";
  /** Rendered in the secondary group of the sidebar. */
  secondary?: boolean;
}

export const RECRUITER_NAV: NavItem[] = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/recruiter/assessments", label: "Assessments", icon: "ClipboardList" },
  { href: "/recruiter/problems", label: "Question bank", icon: "Library" },
  { href: "/recruiter/templates", label: "Templates", icon: "LayoutTemplate" },
  { href: "/recruiter/candidates", label: "Candidates", icon: "Users" },
  {
    href: "/recruiter/invitations",
    label: "Invitations",
    icon: "Mail",
    badge: "pendingInvitations",
  },
  { href: "/recruiter/submissions", label: "Submissions", icon: "Terminal" },
  {
    href: "/recruiter/evaluations",
    label: "Evaluations",
    icon: "PenLine",
    badge: "pendingEvaluations",
  },
  { href: "/recruiter/results", label: "Results", icon: "Trophy" },
  { href: "/recruiter/reports", label: "Reports", icon: "BarChart3" },
  { href: "/recruiter/company", label: "Company", icon: "Building2", secondary: true },
  { href: "/recruiter/credits", label: "Credits & billing", icon: "Coins", secondary: true },
];

export const CANDIDATE_NAV: NavItem[] = [
  { href: "/candidate/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  {
    href: "/candidate/invitations",
    label: "Invitations",
    icon: "Mail",
    badge: "pendingInvitations",
  },
  { href: "/candidate/attempts", label: "My attempts", icon: "History" },
  { href: "/candidate/results", label: "My results", icon: "Trophy" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/companies", label: "Companies", icon: "Building2" },
  { href: "/admin/assessments", label: "Assessments", icon: "ClipboardList" },
  { href: "/admin/problems", label: "Problems", icon: "Library" },
  { href: "/admin/payments", label: "Payments", icon: "CreditCard" },
  { href: "/admin/moderation", label: "Moderation", icon: "ShieldCheck" },
  { href: "/admin/security", label: "Security", icon: "Lock" },
  { href: "/admin/audit-logs", label: "Audit logs", icon: "ScrollText" },
];

export function navForRole(role: Role): NavItem[] {
  switch (role) {
    case "ADMIN":
      return ADMIN_NAV;
    case "RECRUITER":
      return RECRUITER_NAV;
    default:
      return CANDIDATE_NAV;
  }
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "RECRUITER":
      return "/recruiter/dashboard";
    default:
      return "/candidate/dashboard";
  }
}

/** True when `href` is the active section for the current pathname. */
export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function loginPathFor(nextPath?: string): string {
  if (!nextPath || nextPath.startsWith("/login") || nextPath.startsWith("/register")) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

/* ------------------------------------------------------- misc */

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Copy shown on the credits page (the API exposes no fixed per-invite price). */
export const CREDIT_USAGE_NOTE =
  "Inviting candidates draws credits from your company balance. Buy a package to top up — every credit movement is recorded as a credit transaction and reflected in company analytics.";

export const NO_EMAIL_SUPPORT_NOTE =
  "This API deployment does not expose password-reset or email-verification endpoints, so those self-service flows are intentionally not offered here. Ask an administrator to reset your account with PATCH /users/me/password assistance.";