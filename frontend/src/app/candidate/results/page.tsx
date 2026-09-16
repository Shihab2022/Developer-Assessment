"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Trophy } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Result, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard, ProgressBar, EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { formatDateTime, formatDuration } from "@/lib/utils";

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/candidates/me/results", { params: { page, limit: 10 } });
      setResults(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingBlock />;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <PageHeader title="My Results" subtitle="Your released assessment results." />
      {results.length === 0 ? (
        <EmptyState icon={<Trophy className="h-6 w-6" />} title="No results yet" description="Once your results are released, they'll appear here." />
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <ResultCard key={r.id} result={r} />
          ))}
        </div>
      )}
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </main>
  );
}

function ResultCard({ result }: { result: Result }) {
  return (
    <Card>
      <CardHeader
        title={result.assessment?.title ?? "Assessment"}
        subtitle={result.createdAt ? `Released ${formatDateTime(result.createdAt)}` : undefined}
        action={<StatusBadge status={result.passed ? "COMPLETED" : "FAILED"} />}
      />
      <CardBody>
        <div className="mb-3 flex items-center gap-3">
          <p className="text-2xl font-bold text-slate-900">{Math.round(result.percentage)}%</p>
          <div className="flex-1"><ProgressBar value={result.percentage} tone={result.passed ? "green" : "amber"} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center lg:grid-cols-4">
          <StatCard label="Earned" value={`${result.earnedPoints}`} tone="primary" />
                    <StatCard label="Total" value={`${result.totalPoints}`} tone="amber" />
                    {result.correctAnswers != null && <StatCard label="Correct" value={result.correctAnswers} tone="green" />}
          {result.timeTakenSeconds != null && <StatCard label="Time taken" value={formatDuration(result.timeTakenSeconds)} tone="blue" />}
        </div>
        <ResultSkill resultId={result.id} />
        <div className="mt-3 flex justify-end">
          <Link href={`/candidate/attempts/${result.attemptId}`} className="text-xs font-medium text-primary-600 hover:underline">
            View attempt
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

function ResultSkill({ resultId }: { resultId: string }) {
  // In a real implementation this would call /results/{resultId}/skills, surfaced via /results/:id
  return null;
}
