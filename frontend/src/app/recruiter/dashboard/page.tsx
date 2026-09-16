"use client";

import { useRecruiterDashboard } from "@/hooks/useDashboard";
import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatPercent, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Calendar, Users, ClipboardList, Trophy, TrendingUp, MailCheck } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
}) => (
  <Card>
    <CardBody className="flex items-center gap-4 p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </CardBody>
  </Card>
);

export default function RecruiterDashboardPage() {
  const { data, isLoading, isError } = useRecruiterDashboard();

  if (isLoading) {
    return <div className="p-4 text-center">Loading dashboard…</div>;
  }

  if (isError) {
    return <div className="p-4 text-center text-destructive">Failed to load dashboard.</div>;
  }

  const s = data?.summary ?? {
    totalAssessments: 0, activeAssessments: 0, pendingInvitations: 0,
    pendingEvaluations: 0, passRate: 0, completedAttempts: 0,
  };

  return (
    <>
      <PageHeader
        title="Recruiter Dashboard"
        actions={
          <Button size="sm" asChild>
            <Link href="/recruiter/assessments/new">Create assessment</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total assessments" value={s.totalAssessments} icon={ClipboardList} />
        <StatCard title="Active assessments" value={s.activeAssessments} icon={TrendingUp} />
        <StatCard title="Pending invitations" value={s.pendingInvitations} icon={MailCheck} />
        <StatCard title="Pending evaluations" value={s.pendingEvaluations} icon={Trophy} />
        <StatCard title="Pass rate" value={formatPercent(s.passRate)} icon={TrendingUp} />
        <StatCard title="Completed attempts" value={formatNumber(s.completedAttempts)} icon={Users} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent assessments" />
        <CardBody>
          {data?.recentAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments yet. Create one to get started.</p>
          ) : (
            <div className="space-y-3 thin-scrollbar max-h-80 overflow-y-auto">
              {data?.recentAssessments.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <Link href={`/recruiter/assessments/${a.id}`} className="font-medium text-foreground hover:underline">
                      {a.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
