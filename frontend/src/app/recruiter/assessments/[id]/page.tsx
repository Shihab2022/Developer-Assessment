"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, Copy, Pencil, RefreshCw, RotateCcw, Send, Trash2, XCircle } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Assessment, AssessmentHistoryEntry } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, LoadingBlock, EmptyState } from "@/components/ui/Misc";
import { ConfirmDialog } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { ProblemsTab } from "@/components/assessments/ProblemsTab";
import { InvitationsTab } from "@/components/assessments/InvitationsTab";
import { ResultsTab } from "@/components/assessments/ResultsTab";
import { ReportTab } from "@/components/assessments/ReportTab";

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<AssessmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get(`/assessments/${id}`)
      .then((res) => setAssessment(res.data?.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
    if (id) {
      api.get(`/assessments/${id}/history`).then((res) => setHistory(res.data?.data ?? [])).catch(() => {});
    }
  }, [id, load]);

  const runAction = async (action: string) => {
    if (!id) return;
    setBusy(true);
    try {
      if (action === "delete") await api.delete(`/assessments/${id}`);
      else if (action === "recalculate") await api.post(`/assessments/${id}/recalculate-results`);
      else if (action === "duplicate") await api.post(`/assessments/${id}/duplicate`);
      else await api.post(`/assessments/${id}/${action}`);
      toast.success(`Assessment ${action === "recalculate" ? "results recalculated" : action + "d"}`);
      setConfirm(null);
      if (action === "delete") router.push("/recruiter/assessments");
      else if (action === "duplicate") toast.message("Check your assessments list for the draft copy");
      else {
        load();
        api.get(`/assessments/${id}/history`).then((res) => setHistory(res.data?.data ?? [])).catch(() => {});
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!assessment) return <EmptyState title="Assessment not found" />;

  const s = assessment.status;
  const lifecycle = (
    <div className="flex flex-wrap gap-2">
      {(s === "DRAFT" || s === "ACTIVE") && (
        <Button size="sm" variant="success" onClick={() => setConfirm("publish")}><Send className="h-3.5 w-3.5" /> Publish</Button>
      )}
      {s === "PUBLISHED" && (
        <Button size="sm" variant="outline" onClick={() => setConfirm("close")}><XCircle className="h-3.5 w-3.5" /> Close</Button>
      )}
      {s !== "ARCHIVED" && (
        <Button size="sm" variant="ghost" onClick={() => setConfirm("archive")}><Archive className="h-3.5 w-3.5" /> Archive</Button>
      )}
      {s === "ARCHIVED" && (
        <Button size="sm" variant="outline" onClick={() => setConfirm("restore")}><RotateCcw className="h-3.5 w-3.5" /> Restore</Button>
      )}
      <Button size="sm" variant="ghost" onClick={() => setConfirm("duplicate")}><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
      {(s === "ACTIVE" || s === "CLOSED") && (
        <Button size="sm" variant="ghost" onClick={() => setConfirm("recalculate")}><RefreshCw className="h-3.5 w-3.5" /> Recalculate results</Button>
      )}
      {(s === "DRAFT" || s === "PUBLISHED") && (
        <Link href={`/recruiter/assessments/${id}/edit`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>
      )}
      <Button size="sm" variant="danger" onClick={() => setConfirm("delete")}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={assessment.title}
        subtitle={assessment.description || "No description"}
        actions={<StatusBadge status={assessment.status} className="text-sm" />}
      />

      <div className="mt-4">{lifecycle}</div>


      <div className="mt-6">
        <Tabs
          active={tab}
          onChange={setTab}
          items={[
            { key: "overview", label: "Overview" },
            { key: "problems", label: "Problems" },
            { key: "invitations", label: "Invitations" },
            { key: "results", label: "Results" },
            { key: "report", label: "Report & Analytics" },
          ]}
        />
      </div>

      {tab === "overview" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader title="Candidate-facing details" />
              <CardBody className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-700">Instructions</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">{assessment.instructions || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
                  {[
                    ["Duration", `${assessment.durationMinutes} min`],
                    ["Passing score", `${assessment.passingScore} pts`],
                    ["Max attempts", String(assessment.maxAttempts)],
                    ["Access", assessment.accessLevel?.replaceAll("_", " ") ?? "—"],
                    ["Result strategy", assessment.resultStrategy?.replaceAll("_", " ") ?? "—"],
                    ["Anti-cheating", assessment.antiCheatingEnabled ? "Enabled" : "Disabled"],
                    ["Shuffle problems", assessment.shuffleProblems ? "Yes" : "No"],
                    ["Show results", assessment.showResults ? "Yes" : "No"],
                    ["Window", `${assessment.startDate ? formatDateTime(assessment.startDate) : "Open"} → ${assessment.endDate ? formatDateTime(assessment.endDate) : "Open"}`],
                  ].map(([k, val]) => (
                    <div key={k as string}>
                      <p className="text-xs text-slate-400">{k}</p>
                      <p className="font-medium text-slate-800">{val}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
          <Card>
            <CardHeader title="Status history" subtitle="Lifecycle audit trail" />
            <CardBody className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-slate-400">No recorded transitions yet.</p>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="relative border-l-2 border-primary-200 pl-4">
                    <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary-500" />
                    <p className="text-sm font-medium text-slate-800">{h.action}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(h.createdAt)}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {tab === "problems" && id && <div className="mt-6"><ProblemsTab assessmentId={id} onChange={load} /></div>}
      {tab === "invitations" && id && <div className="mt-6"><InvitationsTab assessmentId={id} assessment={assessment} /></div>}
      {tab === "results" && id && <div className="mt-6"><ResultsTab assessmentId={id} /></div>}
      {tab === "report" && id && <div className="mt-6"><ReportTab assessmentId={id} /></div>}


      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && runAction(confirm)}
        title={`${confirm?.[0].toUpperCase()}${confirm!.slice(1)} assessment?`}
        message={
          confirm === "recalculate"
            ? "Recompute all results for this assessment from saved answers and evaluations?"
            : `Are you sure you want to ${confirm} "${assessment.title}"?`
        }
        confirmLabel={confirm ?? "Confirm"}
        danger={confirm === "delete"}
        loading={busy}
      />
    </div>
  );
}
