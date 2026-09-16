"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/api";
import type { CandidateDashboard } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatCard, ProgressBar, LoadingBlock, EmptyState } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { CalendarClock, Trophy } from "lucide-react";

export default function CandidateDashboardPage() {
  const [data, setData] = useState<CandidateDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/candidate")
      .then((res) => setData(res.data?.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading dashboard…" />;
  if (!data) return <EmptyState title="Could not load dashboard" />;

  const s = data.summary;

  return (
    <div>
      <PageHeader title="My Dashboard" subtitle="Your invitations, attempts and results at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Invitations" value={s.totalInvitations} hint={`${s.pendingInvitations} pending`} />
        <StatCard label="Attempts" value={s.totalAttempts} tone="violet" hint={`${s.completedAttempts} completed`} />
        <StatCard label="Results" value={s.totalResults} tone="blue" />
        <StatCard label="Pass rate" value={`${s.passRate}%`} tone="green" hint={`${s.passedResults} passed`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Upcoming / pending invitations */}
        <Card>
          <CardHeader
            title="Pending invitations"
            subtitle="Assessments waiting for you to start"
            action={
              <Link href="/candidate/invitations" className="text-xs font-medium text-primary-600 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {data.upcomingAssessments.length === 0 ? (
              <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No pending invitations" description="You'll see assessments here once a recruiter invites you." />
            ) : (
              data.upcomingAssessments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {inv.assessment?.title ?? "Assessment"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {inv.assessment?.company?.name} · {inv.assessment?.durationMinutes ?? "—"} min
                    </p>
                  </div>
                  <Link
                    href="/candidate/invitations"
                    className="shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    Start
                  </Link>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Recent results */}
        <Card>
          <CardHeader
            title="Recent results"
            action={
              <Link href="/candidate/attempts" className="text-xs font-medium text-primary-600 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {data.recentResults.length === 0 ? (
              <EmptyState icon={<Trophy className="h-6 w-6" />} title="No results yet" description="Complete an assessment to see your score here." />
            ) : (
              data.recentResults.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-slate-800">{r.assessment?.title}</p>
                    <StatusBadge status={r.passed ? "COMPLETED" : "FAILED"} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-xl font-bold text-slate-900">{r.percentage}%</p>
                    <div className="flex-1">
                      <ProgressBar value={r.percentage} tone={r.passed ? "green" : "amber"} />
                    </div>
                    <Link href={`/candidate/attempts/${r.attemptId}`} className="text-xs font-medium text-primary-600 hover:underline">
                      Details
                    </Link>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
