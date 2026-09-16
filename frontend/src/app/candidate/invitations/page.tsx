"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { CalendarClock, Play } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Invitation, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";

export default function InvitationsPage() {
  const [items, setItems] = useState<Invitation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/candidates/me/invitations", { params: { page, limit: 10 } });
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
      <PageHeader title="My Invitations" subtitle="Assessments you've been invited to." />

      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No invitations" description="When a recruiter invites you, it will appear here." />
        ) : (
          items.map((inv) => (
            <InvitationsCard key={inv.id} inv={inv} onStarted={() => load()} />
          ))
        )}
      </div>
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </main>
  );
}

function InvitationsCard({
  inv, onStarted,
}: { inv: Invitation; onStarted: () => void }) {
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/assessments/${inv.assessmentId}/start`);
      const attemptId = res.data?.data?.attemptId ?? res.data?.data?.id;
      if (attemptId) {
        window.location.href = `/candidate/attempts/${attemptId}`;
      } else {
        toast("Could not start attempt", { description: "No attempt id returned" });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  const canStart = inv.status === "PENDING" || inv.status === "ACCEPTED";

  return (
    <Card>
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{inv.assessment?.title ?? "Assessment"}</p>
          {inv.assessment?.company && (
            <p className="text-xs text-slate-400">{inv.assessment.company.name}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>📧 {inv.email}</span>
            {inv.assessment?.durationMinutes && <span>⏱ {inv.assessment.durationMinutes} min</span>}
            {inv.expiresAt && <span>📅 expires {new Date(inv.expiresAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={inv.status} />
          {canStart && (
            <Button size="sm" loading={starting} onClick={start}>
              <Play className="h-3 w-3" /> <span className="ml-1">Start</span>
            </Button>
          )}
          {!canStart && (
            <Link href={`/candidate/attempts`} className="text-xs font-medium text-primary-600 hover:underline">
              View attempt
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
