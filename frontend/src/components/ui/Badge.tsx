import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CircleDot, Gauge, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { STATUS_TONES, type BadgeTone } from "@/lib/constants";
import { humanizeEnum } from "@/lib/utils";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset whitespace-nowrap",
  {
    variants: {
      tone: {
        gray: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
        blue: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900",
        green:
          "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
        amber:
          "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
        red: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900",
        violet:
          "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900",
        indigo:
          "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900",
        slate:
          "bg-slate-800 text-slate-100 ring-slate-700 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: { tone: "gray", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: ReactNode;
}

export function Badge({ tone, size, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {children}
    </span>
  );
}

/** Renders any backend enum value with the tone mapped in `STATUS_TONES`. */
export function StatusBadge({
  status,
  className,
  size,
}: {
  status?: string | null;
  className?: string;
  size?: "sm" | "md";
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge tone={STATUS_TONES[status] ?? "gray"} className={className} size={size}>
      {humanizeEnum(status)}
    </Badge>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  if (!difficulty) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge tone={STATUS_TONES[difficulty] ?? "gray"}>
      <Gauge className="size-3" />
      {humanizeEnum(difficulty)}
    </Badge>
  );
}

export function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return <span className="text-muted-foreground">—</span>;
  return <Badge tone={STATUS_TONES[type] ?? "gray"}>{humanizeEnum(type)}</Badge>;
}

export function RiskBadge({ level, score }: { level?: string | null; score?: number }) {
  if (!level) return <span className="text-muted-foreground">—</span>;
  const Icon = level === "HIGH" ? ShieldAlert : level === "MEDIUM" ? AlertTriangle : CircleDot;
  return (
    <Badge tone={STATUS_TONES[level] ?? "gray"}>
      <Icon className="size-3" />
      {humanizeEnum(level)}
      {typeof score === "number" ? ` · ${score}` : ""}
    </Badge>
  );
}

export function PassedBadge({ passed }: { passed?: boolean | null }) {
  if (passed === null || passed === undefined) return <span className="text-muted-foreground">—</span>;
  return <Badge tone={passed ? "green" : "red"}>{passed ? "Passed" : "Failed"}</Badge>;
}