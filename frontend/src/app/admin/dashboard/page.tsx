"use client";

import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { Users, Building2, ClipboardList, CreditCard, ShieldCheck, TrendingUp } from "lucide-react";

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

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminStats();

  if (isLoading) {
    return <div className="p-4 text-center">Loading admin dashboard…</div>;
  }

  if (isError) {
    return <div className="p-4 text-center text-destructive">Failed to load dashboard.</div>;
  }

  const s = data ?? {
    totalUsers: 0, totalCompanies: 0, totalAssessments: 0,
    totalPayments: 0, totalRevenue: 0, activeUsers: 0,
  };

  return (
    <>
      <PageHeader title="Admin Dashboard" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total users" value={s.totalUsers} icon={Users} />
        <StatCard title="Total companies" value={s.totalCompanies} icon={Building2} />
        <StatCard title="Total assessments" value={s.totalAssessments} icon={ClipboardList} />
        <StatCard title="Total payments" value={s.totalPayments} icon={CreditCard} />
        <StatCard title="Total revenue" value={formatCurrency(s.totalRevenue)} icon={TrendingUp} />
        <StatCard title="Active users" value={s.activeUsers} icon={ShieldCheck} />
      </div>
    </>
  );
}
