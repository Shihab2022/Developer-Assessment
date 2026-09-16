"use client";

import { useEffect, useState } from "react";
import api, { getErrorMessage } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import { PageHeader } from "@/components/ui/Card";
import { StatCard, LoadingBlock, EmptyState } from "@/components/ui/Misc";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/dashboard-stats")
      .then((res) => setStats(res.data?.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock label="Loading platform stats…" />;
  if (!stats) return <EmptyState title="Could not load stats" />;

  const cards: { label: string; value: string | number; tone: "primary" | "green" | "amber" | "red" | "blue" | "violet"; hint?: string }[] = [
    { label: "Total users", value: stats.totalUsers, tone: "primary", hint: `${stats.activeUsers} active` },
    { label: "Candidates", value: stats.totalCandidates, tone: "blue" },
    { label: "Recruiters", value: stats.totalRecruiters, tone: "violet" },
    { label: "Companies", value: stats.totalCompanies, tone: "amber" },
    { label: "Assessments", value: stats.totalAssessments, tone: "primary" },
    { label: "Completed attempts", value: stats.completedAttempts, tone: "green" },
    { label: "Payments", value: stats.totalPayments, tone: "blue" },
    { label: "Revenue", value: `${stats.totalRevenue ?? 0}`, tone: "green", hint: "Total collected" },
    { label: "Suspended users", value: stats.suspendedUsers, tone: "red" },
  ];

  return (
    <div>
      <PageHeader title="Platform Overview" subtitle="Key statistics across the entire platform." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-3">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} tone={c.tone} hint={c.hint} />
        ))}
      </div>
    </div>
  );
}
