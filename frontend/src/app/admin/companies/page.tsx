"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Company, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";

export default function AdminCompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/companies", { params: { page, limit: 10, q } });
      setItems(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <PageHeader title="Companies" subtitle="All companies on the platform." actions={<Button size="sm" variant="outline"><Building2 className="h-4 w-4" /></Button>} />
      <div className="mb-4 max-w-md"><Input placeholder="Search companies…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
      <Card>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Industry</th>
                <th className="px-5 py-3">Credits</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-slate-500">{c.industry ?? "—"}</td>
                  <td className="px-5 py-3">{c.creditBalance ?? 0}</td>
                  <td className="px-5 py-3 text-slate-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {meta && items.length === 0 && !loading ? <EmptyState title="No companies found" /> : <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />}
    </main>
  );
}
