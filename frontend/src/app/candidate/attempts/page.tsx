"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { History } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Attempt, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { formatDuration, formatDateTime } from "@/lib/utils";

export default function AttemptsPage() {
  const [items, setItems] = useState<Attempt[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/candidates/me/attempts", { params: { page, limit: 10 } });
      setItems(res.data?.data ?? []);
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
      <PageHeader title="My Attempts" subtitle="Your in-progress and completed attempts." />
      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={<History className="h-6 w-6" />} title="No attempts yet" description="Start an assessment to see it here." />
        ) : (
          items.map((a) => (
            <Card key={a.id}>
              <CardBody className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{a.assessment?.title ?? "Assessment"}</p>
                  <p className="text-xs text-slate-500">Attempt #{a.attemptNumber} · started {a.startedAt ? formatDateTime(a.startedAt) : "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.status} />
                  {a.submittedAt && a.score != null && (
                    <span className="text-xs font-medium text-slate-600">{a.score}/{a.maxScore} pts</span>
                  )}
                  <Link href={`/candidate/attempts/${a.id}`} className="text-xs font-medium text-primary-600 hover:underline">
                    {["SUBMITTED", "AUTO_SUBMITTED", "COMPLETED", "EXPIRED"].includes(a.status) ? "View" : "Resume"}
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </main>
  );
}
