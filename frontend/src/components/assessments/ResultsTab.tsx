"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Meta, Result } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { formatDuration } from "@/lib/utils";

export function ResultsTab({ assessmentId }: { assessmentId: string }) {
  const [items, setItems] = useState<Result[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recalcing, setRecalcing] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/assessments/${assessmentId}/results`, { params: { page, limit: 10 } })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setMeta(res.data?.meta ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [assessmentId, page]);

  useEffect(() => load(), [load]);

  const recalculate = async () => {
    setRecalcing(true);
    try {
      await api.post(`/assessments/${assessmentId}/recalculate-results`);
      toast.success("Results recalculated");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRecalcing(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Results leaderboard"
        subtitle="Ordered by earned points"
        action={
          <Button size="sm" variant="outline" loading={recalcing} onClick={recalculate}>
            <RefreshCw className="h-3.5 w-3.5" /> Recalculate
          </Button>
        }
      />
      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState title="No results yet" description="Results appear here once candidates submit and attempts are evaluated." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Rank</th>
                <th className="px-5 py-3 font-medium">Candidate</th>
                <th className="px-5 py-3 font-medium">Attempt</th>
                <th className="px-5 py-3 text-right font-medium">Score</th>
                <th className="px-5 py-3 text-right font-medium">Time</th>
                <th className="px-5 py-3 text-right font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r, i) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-bold text-slate-400">#{(meta!.page - 1) * meta!.limit + i + 1}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{r.candidate?.name ?? "Candidate"}</p>
                    <p className="text-xs text-slate-400">{r.candidate?.email}</p>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={r.attempt?.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <p className="font-bold text-slate-900">{r.earnedPoints}/{r.totalPoints}</p>
                    <p className="text-xs text-slate-400">{r.percentage}%</p>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">{formatDuration(r.timeTakenSeconds)}</td>
                  <td className="px-5 py-3 text-right">
                    <StatusBadge status={r.passed ? "COMPLETED" : "FAILED"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </Card>
  );
}
