"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Archive, Copy, Eye, Plus, RotateCcw, Search, Send, XCircle } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Assessment, Meta } from "@/lib/types";
import { ASSESSMENT_STATUSES } from "@/lib/constants";
import { Card, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { ConfirmDialog } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";

export default function AssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ action: string; row: Assessment } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/assessments", { params: { page, limit: 10, q: q || undefined, status: status || undefined } })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setMeta(res.data?.meta ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, q, status]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const runAction = async (action: string, row: Assessment) => {
    setBusy(true);
    try {
      if (action === "delete") await api.delete(`/assessments/${row.id}`);
      else if (action === "duplicate") {
        await api.post(`/assessments/${row.id}/duplicate`);
        toast.success("Assessment duplicated as draft");
      } else await api.post(`/assessments/${row.id}/${action}`);
      toast.success(`Assessment ${action}d successfully`);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

const actionButtons = (row: Assessment) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link href={`/recruiter/assessments/${row.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
        <Eye className="h-3.5 w-3.5" /> Open
      </Link>
      {(row.status === "DRAFT" || row.status === "ACTIVE") && (
        <button onClick={() => setConfirm({ action: "publish", row })} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">Publish</button>
      )}
      {row.status === "PUBLISHED" && (
        <button onClick={() => setConfirm({ action: "close", row })} className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100">Close</button>
      )}
      {row.status !== "ARCHIVED" ? (
        <button onClick={() => setConfirm({ action: "archive", row })} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">Archive</button>
      ) : (
        <button onClick={() => setConfirm({ action: "restore", row })} className="rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100">Restore</button>
      )}
      <button onClick={() => setConfirm({ action: "duplicate", row })} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50">Duplicate</button>
    </div>
  );


  return (
    <div>
      <PageHeader
        title="Assessments"
        subtitle="Create, publish and monitor technical assessments."
        actions={
          <Link href="/recruiter/assessments/new" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
            <Plus className="h-4 w-4" /> New assessment
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by title…" className="pl-9" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        </div>
        <Select className="sm:w-52" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {ASSESSMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="No assessments found" description="Try adjusting the filters or create a new assessment." />
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/recruiter/assessments/${row.id}`} className="truncate font-semibold text-slate-900 hover:text-primary-700">
                    {row.title}
                  </Link>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-slate-500">{row.description || "No description"}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {row.durationMinutes} min · pass ≥ {row.passingScore} pts · max {row.maxAttempts} attempt(s)
                  {row.company?.name ? ` · ${row.company.name}` : ""} · created {formatDateTime(row.createdAt)}
                </p>
              </div>
              <div className="shrink-0">{actionButtons(row)}</div>
            </div>
          ))}
        </div>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}


      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm.action, confirm.row)}
        title={`${confirm?.action[0].toUpperCase()}${confirm!.action.slice(1)} assessment?`}
        message={confirm?.action === "duplicate"
          ? `Create a draft copy of "${confirm.row.title}"?`
          : `Are you sure you want to ${confirm?.action} "${confirm?.row.title}"?`}
        confirmLabel={confirm?.action ?? "Confirm"}
        danger={confirm?.action === "delete"}
        loading={busy}
      />
    </div>
  );
}
