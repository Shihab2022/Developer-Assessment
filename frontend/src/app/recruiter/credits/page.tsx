"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import type { Payment, PaymentPackage, Meta } from "@/lib/types";
import { useAuthStore } from "@/store/auth";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { formatDateTime } from "@/lib/utils";

export default function CreditsPage() {
  const user = useAuthStore((s) => s.user);
  const [company, setCompany] = useState<{ name: string; creditBalance: number } | null>(null);
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [cRes, pRes, hRes] = await Promise.all([
        api.get(`/companies/${user.companyId}`),
        api.get("/payments/packages"),
        api.get("/payments", { params: { page, limit: 10 } }),
      ]);
      setCompany(cRes.data?.data);
      setPackages(pRes.data?.data ?? []);
      setPayments(hRes.data?.data ?? []);
      setMeta(hRes.data?.meta ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.companyId, page]);

  useEffect(() => {
    if (user?.companyId) load();
  }, [user?.companyId, load]);

  const purchase = async (pkg: PaymentPackage) => {
    setPurchasing(pkg.id);
    try {
      const res = await api.post("/payments/initiate", {
        packageId: pkg.id,
        companyId: user?.companyId,
      });
      const data = res.data?.data;
      const url = data?.gatewayUrl ?? data?.mockUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast("No gateway URL returned", { description: "Check the backend configuration" });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!company) return <EmptyState title="No company found" />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <PageHeader
        title="Credits & Billing"
        subtitle="Manage your credit balance and view transaction history."
      />

      <Card>
        <CardHeader title="Current balance" />
        <CardBody>
          <p className="text-3xl font-bold text-primary-600">{company.creditBalance ?? 0} credits</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Credit packages" subtitle="Purchase credits to publish assessments." />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.length === 0 ? (
            <EmptyState title="No packages available" />
          ) : (
            packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 p-5"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                  <p className="text-sm text-slate-600">{pkg.description}</p>
                  <p className="mt-3 text-3xl font-bold text-primary-600">{pkg.credits} credits</p>
                  <p className="text-sm text-slate-500">{pkg.currency} {pkg.price}</p>
                </div>
                <Button
                  className="mt-4 w-full"
                  loading={purchasing === pkg.id}
                  onClick={() => purchase(pkg)}
                >
                  Purchase
                </Button>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Transaction history" subtitle="Last 10 purchases" />
        <CardBody className="p-0">
          {payments.length === 0 ? (
            <EmptyState title="No transactions yet" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Package</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3">{formatDateTime(p.createdAt)}</td>
                    <td className="px-5 py-3">{p.packageName ?? p.packageId ?? "—"}</td>
                    <td className="px-5 py-3">{p.currency ?? "USD"} {p.amount}</td>
                    <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
        {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
      </Card>
    </main>
  );
}
