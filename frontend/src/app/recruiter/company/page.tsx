"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { CompanyAnalytics, Company, Meta, Payment, PaymentPackage } from "@/lib/types";
import { useAuthStore } from "@/store/auth";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { CompanyForm } from "@/components/recruiter/CompanyForm";
import { formatDateTime } from "@/lib/utils";

export default function CompanyPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [company, setCompany] = useState<Company | null>(null);
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [members, setMembers] = useState<unknown[]>([]);
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadCompany = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [cRes, aRes, mRes, pRes, histRes] = await Promise.allSettled([
        api.get(`/companies/${user.companyId}`),
        api.get(`/companies/${user.companyId}/analytics`),
        api.get(`/companies/${user.companyId}/members`),
        api.get("/payments/packages"),
        api.get("/payments", { params: { page, limit: 10 } }),
      ]);
      if (cRes.status === "fulfilled") setCompany(cRes.value.data?.data);
      if (aRes.status === "fulfilled") setAnalytics(aRes.value.data?.data);
      if (mRes.status === "fulfilled") setMembers(mRes.value?.data?.data ?? mRes.value?.data ?? []);
      if (pRes.status === "fulfilled") setPackages(pRes.value.data?.data ?? []);
      if (histRes.status === "fulfilled") {
        setPayments(histRes.value.data?.data ?? []);
        setMeta(histRes.value.data?.meta ?? null);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, page]);

  useEffect(() => {
    if (user?.companyId) loadCompany();
  }, [user?.companyId, loadCompany]);

  const saveCompany = async (body: Record<string, unknown>) => {
    if (editing) {
      await api.patch(`/companies/${user?.companyId}`, body);
      toast.success("Company updated");
      setEditing(false);
      loadCompany();
    } else {
      const res = await api.post("/companies", body);
      toast.success("Company created");
      const me = await api.get("/auth/me");
      setUser(me.data?.data);
      loadCompany();
      void res;
    }
  };

  const initiate = async (pkg: PaymentPackage) => {
    try {
      const res = await api.post("/payments/initiate", { packageId: pkg.id, companyId: user?.companyId });
      const data = res.data?.data;
      const url = data?.gatewayUrl ?? data?.mockUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast("No gateway URL returned", { description: "Check the backend configuration" });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!user?.companyId) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Set up your company" subtitle="Recruiters need a company with credit balance to publish assessments." />
        <CompanyForm submitLabel="Create company" onSubmit={saveCompany} />
      </div>
    );
  }

  if (loading) return <LoadingBlock />;
  if (!company) return <EmptyState title="Company not found" />;

    // __COMPANY_BODY__
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <PageHeader
        title={company.name}
        subtitle={company.industry ? `${company.industry} · ${company.location ?? ""}` : company.description ?? ""}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Edit profile
            </Button>
                        <a
              href="/recruiter/credits"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <CreditCard className="h-4 w-4" /> Credits & billing
            </a>
          </div>
        }
      />

      {/* Profile */}
      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {company.logo ? <img src={company.logo} alt={company.name} className="h-16 w-16 rounded-lg object-cover" /> : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
            <p className="text-sm text-slate-600">{company.description}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {company.website && <span>🌐 {company.website}</span>}
              {company.location && <span>📍 {company.location}</span>}
              {company.size && <span>👥 {company.size}</span>}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-400">Credit balance</p>
            <p className="text-2xl font-bold text-slate-900">{company.creditBalance ?? 0}</p>
          </div>
        </CardBody>
      </Card>

      {/* Analytics stats */}
      {analytics && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <AnalyticsStat label="Total assessments" value={analytics.totalAssessments} tone="primary" />
          <AnalyticsStat label="Invitations sent" value={analytics.totalInvitations} tone="blue" />
          <AnalyticsStat label="Total attempts" value={analytics.totalAttempts} tone="violet" />
          <AnalyticsStat label="Candidate count" value={analytics.candidateCount} tone="green" />
          <AnalyticsStat label="Credits consumed" value={analytics.creditsConsumed} tone="amber" />
          <AnalyticsStat label="Credits remaining" value={analytics.creditsRemaining} tone="slate" />
          <AnalyticsStat label="Average score" value={`${Math.round(analytics.averageScore)}%`} tone="primary" />
          <AnalyticsStat label="Pass rate" value={`${Math.round(analytics.passRate)}%`} tone="green" />
        </div>
      )}

      {/* Members */}
      {members.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Company members" subtitle={`${members.length} member(s)`} />
          <CardBody className="space-y-2">
            {members.map((m, i) => {
              const member = (m as { role: string; user?: { id: string; name: string; email: string } }).user;
              const role = (m as { role: string }).role;
              return member ? (
                <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {member.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={role} />
                </div>
              ) : null;
            })}
          </CardBody>
        </Card>
      )}

             {/* Payments history */}
      <Card className="mb-6">
        <CardHeader title="Payment history" subtitle="Last 10 transactions" action={<a href="/recruiter/credits" className="text-xs font-medium text-primary-600 hover:underline">All</a>} />
        <CardBody className="p-0">
          {payments.length === 0 ? (
            <EmptyState title="No payments yet" description="Purchase a credit package to publish assessments." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Credits</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3">{formatDateTime(p.createdAt)}</td>
                    <td className="px-5 py-3">{p.packageName ?? p.packageId ?? "—"}</td>
                    <td className="px-5 py-3">{p.currency ?? "USD"} {p.amount}</td>
                    <td className="px-5 py-3">{p.credits ?? "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Edit profile modal */}
            {editing && (
        <CompanyForm
          initial={company}
          submitLabel="Save changes"
          onSubmit={async (body) => {
            await api.patch(`/companies/${user?.companyId}`, body);
            toast.success("Company updated");
            setEditing(false);
            loadCompany();
          }}
        />
      )}
    </main>
    );
}

function AnalyticsStat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  const tones: Record<string, string> = {
    primary: "bg-primary-50 text-primary-700 ring-primary-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <div className={`rounded-xl ring-1 ring-inset-1 ${tones[tone] ?? tones.slate} p-4`}>
      <p className="text-2xl font-bold" suppressHydrationWarning>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
