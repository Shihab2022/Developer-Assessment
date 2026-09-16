"use client";

import { useState } from "react";
import { useTemplates, useCreateTemplate, useDeleteTemplate, useUseTemplate } from "@/hooks/useTemplates";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextareaField } from "@/components/ui/Input";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Primitives";
import { Trash2, Plus, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CreateTemplatePayload } from "@/lib/api/payloads";

export default function TemplatesPage() {
  const { data, isLoading } = useTemplates({ limit: 50 });
  const del = useDeleteTemplate();
  const [createOpen, setCreateOpen] = useState(false);
  const templates = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Reusable assessment blueprints — create an assessment from one in a click"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New template
          </Button>
        }
      />
      {isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : templates.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            No templates yet. Create one to standardise your assessments.
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onDelete={() => { if (confirm(`Delete template "${t.title}"?`)) del.mutate(t.id); }}
            />
          ))}
        </div>
      )}
      <CreateTemplateModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: { id: string; title: string; description?: string | null; durationMinutes: number; passingScore: number };
  onDelete: () => void;
}) {
  const router = useRouter();
  const use = useUseTemplate();

  return (
    <Card>
      <CardBody className="flex h-full flex-col justify-between gap-4">
        <div>
          <h3 className="font-medium text-foreground">{template.title}</h3>
          {template.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {template.durationMinutes} min · pass {template.passingScore}%
          </p>
        </div>
        <div className="flex justify-end gap-1">
          <Button
            variant="outline" size="sm"
            onClick={() => use.mutate({ id: template.id }, { onSuccess: (a) => router.push(`/recruiter/assessments/${a.id}`) })}
            disabled={use.isPending}
          >
            <Copy className="size-4" /> Use
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function CreateTemplateModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateTemplate();
  const [form, setForm] = useState<CreateTemplatePayload>({
    title: "",
    description: "",
    durationMinutes: 60,
    passingScore: 60,
    maxAttempts: 1,
  });

  const submit = () => {
    create.mutate(form, {
      onSuccess: () => {
        onOpenChange(false);
        setForm({ title: "", description: "", durationMinutes: 60, passingScore: 60, maxAttempts: 1 });
      },
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
        <ModalHeader title="New template" />
        <div className="space-y-4 p-4">
          <TextField
            label="Title" required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextareaField
            label="Description" rows={3}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-3">
            <TextField
              label="Duration (min)" type="number" min={5}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            />
            <TextField
              label="Passing score (%)" type="number" min={0} max={100}
              value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
            />
            <TextField
              label="Max attempts" type="number" min={1}
              value={form.maxAttempts}
              onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title || create.isPending}>
            {create.isPending ? "Creating…" : "Create template"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
