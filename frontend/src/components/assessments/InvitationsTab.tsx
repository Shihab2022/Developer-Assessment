"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MailPlus, RefreshCw } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Assessment, Invitation, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { formatDateTime } from "@/lib/utils";

export function InvitationsTab({
  assessmentId,
  assessment,
}: {
  assessmentId: string;
  assessment: Assessment;
}) {
  const [items, setItems] = useState<Invitation[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/assessments/${assessmentId}/invitations`, { params: { page, limit: 10, status: status || undefined } })
      .then((res) => {
        setItems(res.data?.data ?? []);
        setMeta(res.data?.meta ?? null);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [assessmentId, page, status]);

  useEffect(() => load(), [load]);

  const resend = async (inv: Invitation) => {
    try {
      await api.post(`/invitations/${inv.id}/resend`);
      toast.success(`Invitation re-sent to ${inv.email}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`Invitations (${meta?.total ?? items.length})`}
          subtitle="Candidates invited to this assessment"
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <MailPlus className="h-4 w-4" /> Invite candidates
            </Button>
          }
        />
        <div className="border-b border-slate-100 px-5 py-3">
          <Select className="sm:w-48" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {["PENDING", "ACCEPTED", "COMPLETED", "REJECTED", "EXPIRED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState title="No invitations yet" description="Invite candidates by email — they will receive a link to accept." />
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((inv) => (
              <div key={inv.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{inv.email}</p>
                  <p className="text-xs text-slate-400">
                    Invited {formatDateTime(inv.createdAt)}
                    {inv.expiresAt ? ` · expires ${formatDateTime(inv.expiresAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inv.status} />
                  {(inv.status === "PENDING" || inv.status === "EXPIRED") && (
                    <Button size="sm" variant="outline" onClick={() => resend(inv)}>
                      <RefreshCw className="h-3.5 w-3.5" /> Resend
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
      </Card>

      {open && <InviteModal assessmentId={assessmentId} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function InviteModal({ assessmentId, onClose, onDone }: { assessmentId: string; onClose: () => void; onDone: () => void }) {
  const [emails, setEmails] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const list = emails
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (list.length === 0) {
      toast.error("Enter at least one email address");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/assessments/${assessmentId}/invitations`, {
        candidates: list.map((email) => ({
          email,
          ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
        })),
      });
      toast.success(`${list.length} invitation(s) sent`);
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite candidates"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Send invitations</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Email addresses" required hint="One per line or comma-separated">
          <Textarea rows={5} placeholder={"candidate1@example.com\ncandidate2@example.com"} value={emails} onChange={(e) => setEmails(e.target.value)} />
        </Field>
        <Field label="Invitation expires at (optional)">
          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
