"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Assessment, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";

export default function AdminAssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/assessments", { params: { page, limit: 10, q } });
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
      <PageHeader title="Assessments" subtitle="All platform assessments." actions={<Button size="sm" variant="outline"><ClipboardList className="h-4 w-4" /></Button>} />
      <div className="mb-4 max-w-md"><Input placeholder="Search assessments…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
      <Card>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3 font-medium">{a.title}</td>
                  <td className="px-5 py-3">{a.company?.name ?? "—"}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3 text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {meta && items.length === 0 && !loading ? <EmptyState title="No assessments found" /> : <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />}
    </main>
  );
}
