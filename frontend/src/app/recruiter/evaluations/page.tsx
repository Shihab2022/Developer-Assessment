"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Attempt, Evaluation, Meta } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/Badge";

export default function EvaluationsPage() {
  const [items, setItems] = useState<Evaluation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/evaluations/pending", { params: { page, limit: 10 } })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setMeta(res.data?.meta ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => load(), [load]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Written Evaluations</h1>
        <p className="mt-1 text-sm text-slate-500">Score written answers manually — MCQs are scored automatically.</p>
      </div>

      <Card>
        <CardHeader title={`Pending evaluations (${meta?.total ?? items.length})`} subtitle="Oldest first" />
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState title="Nothing to evaluate" description="Written answers appear here after candidates submit their attempts." />
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((ev) => (
              <EvaluationRow
                key={ev.id}
                ev={ev}
                expanded={expanded === ev.id}
                onToggle={() => setExpanded(expanded === ev.id ? null : ev.id)}
                onScored={load}
              />
            ))}
          </div>
        )}
        {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
      </Card>
    </div>
  );
}

function EvaluationRow({
  ev, expanded, onToggle, onScored,
}: {
  ev: Evaluation;
  expanded: boolean;
  onToggle: () => void;
  onScored: () => void;
}) {
  const [detail, setDetail] = useState<{ score: number; feedback: string }>({
    score: ev.score,
    feedback: ev.feedback ?? "",
  });
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAttempt = useCallback(() => {
    if (!ev.attempt?.id) return;
    api
      .get(`/attempts/${ev.attempt.id}`)
      .then((res) => setAttempt(res.data?.data))
      .catch(() => {});
  }, [ev.attempt?.id]);

  useEffect(() => {
    if (expanded) loadAttempt();
  }, [expanded, loadAttempt]);

  const savedAnswer =
    attempt?.answers?.find((a) => a.problemId === ev.problemId)?.answer as
      | { text?: string }
      | undefined;

  const score = async () => {
    if (!ev.attempt?.id) return;
    setSubmitting(true);
    try {
      await api.post("/evaluations/written", {
        attemptId: ev.attempt.id,
        problemId: ev.problemId,
        score: Number(detail.score),
        feedback: detail.feedback,
      });
      toast.success("Written answer scored");
      onScored();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pr-2">
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-3"
        onClick={onToggle}
      >
        <div className="min-w-0">
          <p className="font-medium text-slate-800">{ev.problem?.title}</p>
          <p className="text-xs text-slate-400">
            {ev.attempt?.candidate?.name ?? "Candidate"} · {ev.attempt?.assessment?.title ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={ev.status} />
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="prose prose-sm max-w-none overflow-x-auto rounded-xl bg-slate-50 p-4 text-slate-800">
            {savedAnswer?.text
              ? savedAnswer.text.split("\n").map((l, i) => <p key={i}>{l || "\u00A0"}</p>)
              : "Loading answer…"}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:items-end">
            <Field label="Score (points)">
              <Input
                type="number"
                min={0}
                value={detail.score}
                onChange={(e) => setDetail((d) => ({ ...d, score: Number(e.target.value) }))}
              />
            </Field>
            <Field label="Feedback" className="sm:col-span-2">
              <Textarea
                rows={3}
                placeholder="What was good / what needs improvement…"
                value={detail.feedback}
                onChange={(e) => setDetail((d) => ({ ...d, feedback: e.target.value }))}
              />
            </Field>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onToggle}>Collapse</Button>
            <Button size="sm" loading={submitting} onClick={score}>Save evaluation</Button>
          </div>
        </div>
      )}
    </div>
  );
}

