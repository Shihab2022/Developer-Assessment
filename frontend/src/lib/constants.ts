import type { Role } from "./types";

export const PROBLEM_TYPES = ["CODING", "MCQ", "WRITTEN"] as const;
export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const PROBLEM_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const ASSESSMENT_STATUSES = ["DRAFT", "PUBLISHED", "ACTIVE", "CLOSED", "ARCHIVED"] as const;
export const RESULT_STRATEGIES = ["LATEST_SCORE", "BEST_SCORE", "AVERAGE_SCORE"] as const;
export const ACCESS_LEVELS = ["INVITATION_ONLY", "PUBLIC"] as const;
export const RECRUITMENT_STATUSES = [
  "INVITED",
  "STARTED",
  "COMPLETED",
  "SHORTLISTED",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
] as const;

export const PROGRAMMING_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
] as const;

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

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

/** lucide icon names resolved in AppShell */
export const RECRUITER_NAV: NavItem[] = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/recruiter/assessments", label: "Assessments", icon: "ClipboardList" },
  { href: "/recruiter/problems", label: "Problem Bank", icon: "Library" },
  { href: "/recruiter/candidates", label: "Candidates", icon: "Users" },
  { href: "/recruiter/evaluations", label: "Evaluations", icon: "PenLine" },
  { href: "/recruiter/templates", label: "Templates", icon: "LayoutTemplate" },
  { href: "/recruiter/company", label: "Company", icon: "Building2" },
  { href: "/recruiter/credits", label: "Credits & Billing", icon: "Coins" },
];

export const CANDIDATE_NAV: NavItem[] = [
  { href: "/candidate/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/candidate/invitations", label: "Invitations", icon: "Mail" },
  { href: "/candidate/attempts", label: "My Attempts", icon: "History" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Overview", icon: "LayoutDashboard" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/companies", label: "Companies", icon: "Building2" },
  { href: "/admin/assessments", label: "Assessments", icon: "ClipboardList" },
  { href: "/admin/problems", label: "Problems", icon: "Library" },
  { href: "/admin/payments", label: "Payments", icon: "CreditCard" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "ScrollText" },
];
