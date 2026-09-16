"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NotebookPen, RefreshCw } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { CandidateRow, Meta, User } from "@/lib/types";
import { RECRUITMENT_STATUSES } from "@/lib/constants";
import { useAuthStore } from "@/store/auth";
import { Card, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Modal";
import { NotesModal } from "@/components/recruiter/NotesModal";
import { formatDateTime } from "@/lib/utils";

export default function CandidatesPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [companyId, setCompanyId] = useState<string | null>(user?.companyId ?? null);
  const [items, setItems] = useState<CandidateRow[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [notesFor, setNotesFor] = useState<CandidateRow | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId && user) {
      api
        .get("/users/me")
        .then((res) => {
          const me: User = res.data?.data;
          setUser(me);
          setCompanyId(me.companyId ?? null);
        })
        .catch(() => setLoading(false));
    }
  }, [companyId, user, setUser]);

  const load = useCallback(() => {
    if (!companyId) return;
    setLoading(true);
    api
      .get(`/companies/${companyId}/candidates`, { params: { page, limit: 10, status: status || undefined } })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setMeta(res.data?.meta ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [companyId, page, status]);

  useEffect(() => load(), [load]);

  const changeStatus = async (row: CandidateRow, recruitmentStatus: string) => {
    setRowBusy(row.invitationId);
    try {
      await api.patch(`/companies/candidates/${row.invitationId}/status`, { recruitmentStatus });
      toast.success(`Moved to ${recruitmentStatus.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Candidate Pipeline"
        subtitle="Track every invited candidate and move them through your hiring funnel."
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        }
      />

      {!companyId && !loading ? (
        <EmptyState title="No company linked" description="Create your company on the Company page to start inviting candidates." />
      ) : (
        <>
          <div className="mb-4">
            <Select className="sm:w-56" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="">All recruitment stages</option>
              {RECRUITMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>

          {loading ? (
            <LoadingBlock />
          ) : items.length === 0 ? (
            <EmptyState title="No candidates yet" description="Invite candidates from an assessment's Invitations tab." />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">Candidate</th>
                      <th className="px-5 py-3 font-medium">Assessment</th>
                      <th className="px-5 py-3 font-medium">Invitation</th>
                      <th className="px-5 py-3 font-medium">Stage</th>
                      <th className="px-5 py-3 font-medium">Result</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((row) => (
                      <tr key={row.invitationId} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-800">{row.candidate?.name ?? row.email}</p>
                          <p className="text-xs text-slate-400">{row.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <Link href={`/recruiter/assessments/${row.assessment?.id}`} className="text-primary-600 hover:underline">
                            {row.assessment?.title ?? "—"}
                          </Link>
                        </td>
                        <td className="px-5 py-3"><StatusBadge status={row.invitationStatus} /></td>
                        <td className="px-5 py-3">
                          <Select
                            className="h-8 w-36 text-xs"
                            value={row.recruitmentStatus}
                            disabled={rowBusy === row.invitationId}
                            onChange={(e) => changeStatus(row, e.target.value)}
                          >
                            {RECRUITMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </Select>
                        </td>
                        <td className="px-5 py-3">
                          {row.result ? (
                            <span className="font-bold text-slate-800">{row.result.percentage}% {row.result.passed ? "✅" : "❌"}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Button size="sm" variant="outline" onClick={() => setNotesFor(row)}>
                            <NotebookPen className="h-3.5 w-3.5" /> Notes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
            </Card>
          )}

        </>
      )}

      {notesFor && (
        <NotesModal
          candidateId={notesFor.candidateId}
          candidateName={notesFor.candidate?.name ?? notesFor.email}
          assessmentId={notesFor.assessment?.id}
          companyId={companyId ?? undefined}
          onClose={() => setNotesFor(null)}
        />
      )}
    </div>
  );
}
