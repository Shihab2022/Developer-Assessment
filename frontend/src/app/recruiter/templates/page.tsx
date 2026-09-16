"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Plus, Copy, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { AssessmentTemplate, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TemplateForm } from "@/components/recruiter/TemplateForm";

export default function TemplatesPage() {
  const router = useRouter();
  const [items, setItems] = useState<AssessmentTemplate[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ id: string; title: string } | null>(null);
  const [editing, setEditing] = useState<AssessmentTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/assessment-templates", { params: { page, limit: 10 } });
      setItems(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const mutate = () => { load(); };

  const useTemplate = async (t: AssessmentTemplate) => {
    try {
      const res = await api.post(`/assessment-templates/${t.id}/use`, {});
      const assessmentId = res.data?.data?.id ?? res.data?.data?.assessmentId;
      if (assessmentId) router.push(`/recruiter/assessments/${assessmentId}/edit`);
      else toast.success("Template used as new assessment");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const remove = async () => {
    if (!confirm) return;
    try {
      await api.delete(`/assessment-templates/${confirm.id}`);
      toast.success("Template deleted");
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingBlock />;
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <PageHeader
        title="Assessment Templates"
        subtitle="Reusable assessment configurations you can launch in one click."
        actions={<Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> New template</Button>}
      />

      <div className="space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={<LayoutTemplate className="h-6 w-6" />} title="No templates" description="Create a template to reuse assessment settings." />
        ) : (
          items.map((t) => (
            <Card key={t.id}>
              <CardBody className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{t.title}</p>
                  <p className="mt-0.5 max-w-xl text-sm text-slate-600 line-clamp-2">{t.description}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                    {t.durationMinutes && <span>⏱ {t.durationMinutes} min</span>}
                    {t.skills?.length ? <span>🏷 {t.skills.join(", ")}</span> : null}
                    {t.companyId && <span>🏢 scoped</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={t.status ?? "DRAFT"} />
                  <Button size="sm" variant="outline" onClick={() => useTemplate(t)}>
                    <Copy className="h-3 w-3" /> Use
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(t); setOpen(true); }}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setConfirm({ id: t.id, title: t.title })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>
      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? "Edit template" : "New template"}
      >
        <TemplateForm
          initial={editing}
          onSubmit={async (body) => {
            if (editing) {
              await api.patch(`/assessment-templates/${editing.id}`, body);
              toast.success("Template updated");
            } else {
              await api.post("/assessment-templates", body);
              toast.success("Template created");
            }
            setOpen(false); setEditing(null);
            load();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        title="Delete template"
        message={`Delete "${confirm?.title}"? This cannot be undone.`}
        danger
      />
    </main>
  );
}
