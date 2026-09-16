"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Meta, Problem } from "@/lib/types";
import { DIFFICULTIES, PROBLEM_TYPES } from "@/lib/constants";
import { Card, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { ConfirmDialog } from "@/components/ui/Modal";

export default function ProblemsPage() {
  const [items, setItems] = useState<Problem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteRow, setDeleteRow] = useState<Problem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/problems", {
        params: { page, limit: 10, q: q || undefined, type: type || undefined, difficulty: difficulty || undefined },
      })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setMeta(res.data?.meta ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, q, type, difficulty]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const doDelete = async () => {
    if (!deleteRow) return;
    try {
      await api.delete(`/problems/${deleteRow.id}`);
      toast.success("Problem deleted");
      setDeleteRow(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Problem Bank"
        subtitle="Your reusable coding, MCQ and written questions."
        actions={
          <Link href="/recruiter/problems/new" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
            <Plus className="h-4 w-4" /> New problem
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search problems…" className="pl-9" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        </div>
        <Select className="sm:w-40" value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
          <option value="">All types</option>
          {PROBLEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select className="sm:w-40" value={difficulty} onChange={(e) => { setPage(1); setDifficulty(e.target.value); }}>
          <option value="">All levels</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="No problems found" description="Create your first problem or adjust the filters." />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {items.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{p.title}</p>
                    <StatusBadge status={p.type} />
                    <StatusBadge status={p.difficulty} />
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{p.description}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {p.points} pts{p.category ? ` · ${p.category}` : ""}
                    {Array.isArray(p.tags) && p.tags.length > 0 ? ` · ${p.tags.map((t) => (typeof t === "string" ? t : t.name)).join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Link href={`/recruiter/problems/${p.id}`} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <Button2 onClick={() => setDeleteRow(p)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}


      <ConfirmDialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={doDelete}
        title="Delete problem?"
        message={`"${deleteRow?.title}" will be removed from the bank (soft delete).`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function Button2({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete problem">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
