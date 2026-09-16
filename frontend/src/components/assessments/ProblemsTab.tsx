"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { AssessmentProblem, Meta, Problem, ProblemType } from "@/lib/types";
import { PROBLEM_TYPES } from "@/lib/constants";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Toggle } from "@/components/ui/Input";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";

export function ProblemsTab({ assessmentId, onChange }: { assessmentId: string; onChange?: () => void }) {
  const [items, setItems] = useState<AssessmentProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [removeRow, setRemoveRow] = useState<AssessmentProblem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/assessments/${assessmentId}/problems`, { params: { limit: 100 } })
      .then((res) => setItems(res.data?.data ?? []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  useEffect(() => load(), [load]);

  const remove = async () => {
    if (!removeRow) return;
    try {
      await api.delete(`/assessments/${assessmentId}/problems/${removeRow.problemId}`);
      toast.success("Problem removed from assessment");
      setRemoveRow(null);
      load();
      onChange?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`Attached problems (${items.length})`}
          subtitle="Configure points, sections and ordering"
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Add problem
            </Button>
          }
        />
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState title="No problems attached" description="Add problems from your problem bank." />
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((ap) => (
              <ProblemRow key={ap.id} ap={ap} assessmentId={assessmentId} reload={load} onRemove={() => setRemoveRow(ap)} />
            ))}
          </div>
        )}
      </Card>

      {addOpen && (
        <AddProblemModal
          assessmentId={assessmentId}
          existingIds={items.map((i) => i.problemId)}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            load();
            onChange?.();
          }}
        />
      )}

      <ConfirmDialog
        open={!!removeRow}
        onClose={() => setRemoveRow(null)}
        onConfirm={remove}
        title="Remove problem?"
        message={`"${removeRow?.problem?.title}" will be detached from this assessment.`}
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}

function ProblemRow({
  ap, assessmentId, reload, onRemove,
}: {
  ap: AssessmentProblem;
  assessmentId: string;
  reload: () => void;
  onRemove: () => void;
}) {
  const p = ap.problem;
  const [points, setPoints] = useState(ap.points);
  const [section, setSection] = useState(ap.section ?? "");
  const [order, setOrder] = useState(ap.order);
  const [required, setRequired] = useState(ap.isRequired);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/assessments/${assessmentId}/problems/${p.id}`, {
        points: Number(points), section: section || undefined, order: Number(order), isRequired: required,
      });
      toast.success("Problem configuration saved");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-slate-900">{p.title}</p>
          <StatusBadge status={p.type} />
          <StatusBadge status={p.difficulty} />
          <Badge tone="gray">{ap.points} pts</Badge>
          {ap.section && <Badge tone="violet">{ap.section}</Badge>}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{p.description}</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Points"><Input type="number" min={0} className="w-20" value={points} onChange={(e) => setPoints(Number(e.target.value))} /></Field>
        <Field label="Order"><Input type="number" min={0} className="w-20" value={order} onChange={(e) => setOrder(Number(e.target.value))} /></Field>
        <Field label="Section"><Input className="w-32" placeholder="e.g. Algorithms" value={section} onChange={(e) => setSection(e.target.value)} /></Field>
        <div className="pb-2.5"><Toggle label="Required" checked={required} onChange={setRequired} /></div>
        <Button size="sm" variant="outline" loading={saving} onClick={save}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onRemove} aria-label="Remove"><Trash2 className="h-4 w-4 text-rose-500" /></Button>
      </div>
    </div>
  );
}


function AddProblemModal({
  assessmentId, existingIds, onClose, onAdded,
}: {
  assessmentId: string;
  existingIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [items, setItems] = useState<Problem[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Problem | null>(null);
  const [points, setPoints] = useState(10);
  const [section, setSection] = useState("");
  const [required, setRequired] = useState(true);
  const [saving, setSaving] = useState(false);

  const search = useCallback(() => {
    setLoading(true);
    api
      .get("/problems", { params: { page, limit: 8, q: q || undefined, type: type || undefined } })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setMeta(res.data?.meta ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, q, type]);

  useEffect(() => {
    const t = setTimeout(search, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, q]);

  const add = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/assessments/${assessmentId}/problems`, {
        problemId: selected.id,
        points: Number(points),
        section: section || undefined,
        isRequired: required,
      });
      toast.success(`"${selected.title}" added to assessment`);
      onAdded();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add problem from bank" width="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={add} loading={saving} disabled={!selected}>Add to assessment</Button></>}>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search problems…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
        </div>
        <Select className="w-36" value={type} onChange={(e) => { setPage(1); setType(e.target.value); }}>
          <option value="">All types</option>
          {PROBLEM_TYPES.map((t) => <option key={t} value={t as ProblemType}>{t}</option>)}
        </Select>
      </div>

      {selected && (
        <div className="mb-4 rounded-xl border-2 border-primary-500 bg-primary-50/50 p-4">
          <p className="font-semibold text-slate-900">{selected.title}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Points"><Input type="number" min={0} value={points} onChange={(e) => setPoints(Number(e.target.value))} /></Field>
            <Field label="Section"><Input placeholder="Optional" value={section} onChange={(e) => setSection(e.target.value)} /></Field>
            <div className="flex items-end pb-1"><Toggle label="Required" checked={required} onChange={setRequired} /></div>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-2">
          {items.filter((p) => !existingIds.includes(p.id)).map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === p.id ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-slate-300"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-slate-800">{p.title}</p>
                <div className="flex shrink-0 gap-1">
                  <StatusBadge status={p.type} />
                  <StatusBadge status={p.difficulty} />
                </div>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.description}</p>
              <p className="mt-0.5 text-xs text-slate-400">{p.points} pts{p.category ? ` · ${p.category}` : ""}</p>
            </button>
          ))}
          {items.filter((p) => !existingIds.includes(p.id)).length === 0 && (
            <EmptyState title="No problems found" description="Create problems in the Problem Bank first." />
          )}
        </div>
      )}
      {meta && <div className="mt-3"><Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} /></div>}
    </Modal>
  );
}

