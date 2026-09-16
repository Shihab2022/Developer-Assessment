import { cn } from "@/lib/utils";

export type BadgeTone =
  | "gray"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "violet"
  | "indigo"
  | "slate";

const toneClasses: Record<BadgeTone, string> = {
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  slate: "bg-slate-800 text-slate-100 ring-slate-700",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusTones: Record<string, BadgeTone> = {
  // Assessment / generic lifecycle
  DRAFT: "gray",
  PUBLISHED: "blue",
  ACTIVE: "green",
  CLOSED: "amber",
  ARCHIVED: "slate",
  // Attempts
  NOT_STARTED: "gray",
  IN_PROGRESS: "blue",
  SUBMITTED: "indigo",
  AUTO_SUBMITTED: "amber",
  EVALUATING: "amber",
  COMPLETED: "green",
  EXPIRED: "gray",
  // Invitations
  PENDING: "amber",
  ACCEPTED: "blue",
  REJECTED: "red",
  // Problems
  EASY: "green",
  MEDIUM: "amber",
  HARD: "red",
  CODING: "indigo",
  MCQ: "blue",
  WRITTEN: "violet",
  // Payments
  PAID: "green",
  FAILED: "red",
  CANCELLED: "gray",
  REFUNDED: "violet",
  // Users
  SUSPENDED: "red",
  DELETED: "gray",
  // Submissions
  RUNNING: "blue",
  PARTIAL: "amber",
  ERROR: "red",
  MANUAL_REVIEW: "violet",
  // Pipeline
  SHORTLISTED: "violet",
  INTERVIEW: "blue",
  HIRED: "green",
  STARTED: "blue",
  INVITED: "gray",
  // Risk
  LOW: "green",
  MEDIUM_RISK: "amber",
  HIGH: "red",
  // Notification
  UNREAD: "blue",
  READ: "gray",
};

export function StatusBadge({
  status,
  className,
  prefix,
}: {
  status?: string | null;
  className?: string;
  prefix?: string;
}) {
  if (!status) return <span className="text-slate-400">—</span>;
  const tone = statusTones[status] ?? "gray";
  return (
    <Badge tone={tone} className={className}>
      {prefix}
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
