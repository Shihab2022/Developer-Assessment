"use client";

import { useCandidateDashboard } from "@/hooks/useDashboard";
import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatPercent, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Calendar, Mail, History, Trophy, Users } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) => (
  <Card>
    <CardBody className="flex items-center gap-4 p-5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </CardBody>
  </Card>
);

export default function CandidateDashboardPage() {
  const { data, isLoading, isError } = useCandidateDashboard();

  if (isLoading) {
    return <div className="p-4 text-center">Loading dashboard…</div>;
  }

  if (isError) {
    return <div className="p-4 text-center text-destructive">Failed to load dashboard.</div>;
  }

  const s = data?.summary ?? {
    totalInvitations: 0, pendingInvitations: 0, totalAttempts: 0,
    totalResults: 0, passRate: 0,
  };

  return (
    <>
      <PageHeader title="Candidate Dashboard" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending invitations" value={s.pendingInvitations} icon={Mail} />
        <StatCard title="Total attempts" value={s.totalAttempts} icon={History} />
        <StatCard title="Total results" value={s.totalResults} icon={Trophy} />
        <StatCard title="Pass rate" value={formatPercent(s.passRate)} icon={Users} />
      </div>

      {data?.upcomingAssessments && data.upcomingAssessments.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Upcoming assessments" />
          <CardBody>
            <div className="space-y-3 thin-scrollbar max-h-64 overflow-y-auto">
              {data.upcomingAssessments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between">
                  <div>
                    <Link href={`/candidate/invitations`} className="font-medium text-foreground hover:underline">
                      {inv.assessment?.title ?? "Untitled assessment"}
                    </Link>
                                        <p className="text-xs text-muted-foreground">
                      Expires{" "}
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
}
