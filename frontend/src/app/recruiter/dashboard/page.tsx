"use client";

import { useRecruiterDashboard } from "@/hooks/useDashboard";
import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, PassedBadge, Badge } from "@/components/ui/Badge";
import { formatPercent, formatNumber, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import {
  Calendar, Users, ClipboardList, Trophy, TrendingUp, MailCheck,
  PenLine, Library, Plus, Building2,
} from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  hint?: string;
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
        {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
      </div>
    </CardBody>
  </Card>
);

export default function RecruiterDashboardPage() {
  const { data, isLoading, isError, refetch } = useRecruiterDashboard();

  if (isLoading) {
    return <div className="p-4 text-center">Loading dashboard…</div>;
  }

  if (isError || !data) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            We could not load your dashboard statistics right now.
          </p>
          <Button size="sm" className="mt-4" onClick={() => refetch()}>
            Try again
          </Button>
        </CardBody>
      </Card>
    );
  }

  const s = data.summary ?? {
    totalAssessments: 0, activeAssessments: 0, draftAssessments: 0, closedAssessments: 0,
    totalInvitations: 0, pendingInvitations: 0, acceptedInvitations: 0, totalAttempts: 0,
    completedAttempts: 0, inProgressAttempts: 0, totalResults: 0, passedResults: 0,
    passRate: 0, completionRate: 0, totalProblems: 0, activeProblems: 0, pendingEvaluations: 0,
  };
  const recentAssessments = data.recentAssessments ?? [];
  const recentResults = data.recentResults ?? [];

  return (
    <>
      <PageHeader
        title="Recruiter Dashboard"
        subtitle="Your hiring pipeline at a glance"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/recruiter/problems">
                <Plus className="size-4" /> New question
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/recruiter/assessments/new">Create assessment</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total assessments"
          value={s.totalAssessments}
          icon={ClipboardList}
          hint={`${s.draftAssessments} draft · ${s.closedAssessments} closed`}
        />
        <StatCard title="Active assessments" value={s.activeAssessments} icon={TrendingUp} />
        <StatCard
          title="Pending invitations"
          value={s.pendingInvitations}
          icon={MailCheck}
          hint={`${s.acceptedInvitations} accepted of ${s.totalInvitations}`}
        />
        <StatCard title="Pending evaluations" value={s.pendingEvaluations} icon={PenLine} />
        <StatCard title="Pass rate" value={formatPercent(s.passRate)} icon={Trophy} />
        <StatCard
          title="Completed attempts"
          value={formatNumber(s.completedAttempts)}
          icon={Users}
          hint={`${s.inProgressAttempts} in progress`}
        />
        <StatCard
          title="Invitation completion"
          value={formatPercent(s.completionRate)}
          icon={Calendar}
        />
        <StatCard
          title="Question bank"
          value={s.totalProblems}
          icon={Library}
          hint={`${s.activeProblems} active`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent assessments"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/recruiter/assessments">View all</Link>
              </Button>
            }
          />
          <CardBody>
            {recentAssessments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assessments yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-3 thin-scrollbar max-h-80 overflow-y-auto">
                {recentAssessments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/recruiter/assessments/${a.id}`}
                        className="truncate font-medium text-foreground hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Created {a.createdAt ? formatDateTime(a.createdAt) : "—"}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Recent results"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/recruiter/results">View all</Link>
              </Button>
            }
          />
          <CardBody>
            {recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No candidate results yet — invite candidates to an assessment to
                start collecting scores.
              </p>
            ) : (
              <div className="space-y-3 thin-scrollbar max-h-80 overflow-y-auto">
                {recentResults.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {r.candidate?.name ?? "Candidate"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.assessment?.title ?? "Assessment"} ·{" "}
                        {r.earnedPoints}/{r.totalPoints} pts
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge size="sm">{formatPercent(r.percentage ?? 0)}</Badge>
                      <PassedBadge passed={r.passed} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Credits & plans" icon={<Building2 className="size-4" />} />
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">
            Publishing an assessment costs one company credit, and every credit
            movement is recorded for your billing history.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/recruiter/company">Company overview</Link>
          </Button>
        </CardBody>
      </Card>
    </>
  );
}
