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
  return <div>HEADER_MARKER</div>;
}
