"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import type { Company } from "@/lib/types";

export function CompanyForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Company | null;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    logo: initial?.logo ?? "",
    description: initial?.description ?? "",
    website: initial?.website ?? "",
    industry: initial?.industry ?? "",
    location: initial?.location ?? "",
    size: initial?.size ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ ...form, name: form.name.trim(), logo: form.logo || undefined, website: form.website || undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <CardHeader title="Company profile" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" required className="sm:col-span-2">
            <Input required placeholder="TechCorp Solutions" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Logo URL">
            <Input placeholder="https://…" value={form.logo} onChange={set("logo")} />
          </Field>
          <Field label="Website">
            <Input placeholder="https://techcorp.example.com" value={form.website} onChange={set("website")} />
          </Field>
          <Field label="Industry">
            <Input placeholder="Software Development" value={form.industry} onChange={set("industry")} />
          </Field>
          <Field label="Location">
            <Input placeholder="Dhaka, Bangladesh" value={form.location} onChange={set("location")} />
          </Field>
          <Field label="Size">
            <Input placeholder="50-100" value={form.size} onChange={set("size")} />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea rows={3} placeholder="What your company does…" value={form.description} onChange={set("description")} />
          </Field>
        </CardBody>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" loading={saving} size="lg">{submitLabel}</Button>
      </div>
    </form>
  );
}
