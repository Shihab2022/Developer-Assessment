"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ClipboardList, UserCheck, Users } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { RecruiterDashboard } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatCard, ProgressBar, LoadingBlock, EmptyState } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

export default function RecruiterDashboardPage() {
  const [data, setData] = useState<RecruiterDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/recruiter")
      .then((res) => setData(res.data?.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading dashboard…" />;
  if (!data) return <EmptyState title="Could not load dashboard" description="Please refresh the page." />;

  const s = data.summary;

  return (
    <div>
      <PageHeader
        title="Recruiter Dashboard"
        subtitle="Hiring pulse across your company's assessments."
        actions={
          <Link
            href="/recruiter/assessments/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <ClipboardList className="h-4 w-4" /> New assessment
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assessments" value={s.totalAssessments} hint={`${s.activeAssessments} active · ${s.draftAssessments} drafts`} />
        <StatCard label="Invitations" value={s.totalInvitations} tone="blue" hint={`${s.pendingInvitations} pending`} />
        <StatCard label="Attempts" value={s.totalAttempts} tone="violet" hint={`${s.completedAttempts} completed`} />
        <StatCard label="Results" value={s.totalResults} tone="green" hint={`${s.passedResults} passed`} />
      </div>

      {/* Rates */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-700">Pass rate</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.passRate}%</p>
            <div className="mt-3"><ProgressBar value={s.passRate} tone="green" /></div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-slate-700">Completion rate</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.completionRate}%</p>
            <div className="mt-3"><ProgressBar value={s.completionRate} /></div>
          </CardBody>
        </Card>
        <Link href="/recruiter/evaluations" className="group">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardBody className="flex h-full items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Pending written evaluations</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{s.pendingEvaluations}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary-600">
                  Review now <ArrowUpRight className="h-3.5 w-3.5" />
                </p>
              </div>
              <UserCheck className="h-6 w-6 text-amber-500" />
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Recent lists */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent assessments"
            action={
              <Link href="/recruiter/assessments" className="text-xs font-medium text-primary-600 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="space-y-1 p-2">
            {data.recentAssessments.length === 0 ? (
              <EmptyState title="No assessments yet" description="Create your first assessment." />
            ) : (
              data.recentAssessments.map((a) => (
                <Link
                  key={a.id}
                  href={`/recruiter/assessments/${a.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(a.createdAt)}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent results" subtitle="Latest scored attempts" />
          <CardBody className="p-0">
            {data.recentResults.length === 0 ? (
              <EmptyState title="No results yet" description="Results appear once attempts are evaluated." />
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.recentResults.map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{r.candidate?.name ?? "Candidate"}</p>
                        <p className="text-xs text-slate-400">{r.assessment?.title}</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="font-bold text-slate-900">{r.percentage}%</p>
                        <p className="text-xs text-slate-400">{r.earnedPoints}/{r.totalPoints} pts</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <StatusBadge status={r.passed ? "COMPLETED" : "FAILED"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Extra stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Problem bank" value={s.totalProblems} tone="blue" hint={`${s.activeProblems} active`} />
        <StatCard label="Closed assessments" value={s.closedAssessments} tone="amber" />
        <StatCard label="Accepted invites" value={s.acceptedInvitations} tone="violet" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Passed candidates" value={s.passedResults} tone="green" />
      </div>

    </div>
  );
}
