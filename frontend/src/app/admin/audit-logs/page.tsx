"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { AuditLog, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit-logs", { params: { page, limit: 10, action: q || undefined } });
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
      <PageHeader title="Audit Logs" subtitle="Platform-wide audit trail." actions={<Button size="sm" variant="outline"><ScrollText className="h-4 w-4" /></Button>} />
      <div className="mb-4 max-w-md"><Input placeholder="Filter by action…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
      <Card>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">IP</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-3 font-medium">{l.action}</td>
                  <td className="px-5 py-3 text-slate-500">{l.entityType}#{l.entityId ?? "—"}</td>
                  <td className="px-5 py-3">{l.actor?.name ?? "System"}</td>
                  <td className="px-5 py-3 text-slate-500">{l.ipAddress ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {meta && items.length === 0 && !loading ? <EmptyState title="No audit logs found" /> : <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />}
    </main>
  );
}
