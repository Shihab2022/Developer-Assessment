"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import type { AssessmentTemplate } from "@/lib/types";

export function TemplateForm({
  initial,
  onSubmit,
}: {
  initial?: AssessmentTemplate | null;
  onSubmit: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    durationMinutes: initial?.durationMinutes ?? 60,
    passingScore: initial?.passingScore ?? 0,
    maxAttempts: initial?.maxAttempts ?? 1,
    shuffleProblems: initial?.shuffleProblems ?? true,
    shuffleOptions: initial?.shuffleOptions ?? false,
    showResults: initial?.showResults ?? true,
    antiCheatingEnabled: initial?.antiCheatingEnabled ?? true,
    resultStrategy: "LATEST_SCORE",
    accessLevel: "INVITATION_ONLY",
    skills: initial?.skills?.join(", ") ?? "",
    status: initial?.status ?? "DRAFT",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k: keyof typeof form) => (v: boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        passingScore: Number(form.passingScore) || undefined,
        maxAttempts: Number(form.maxAttempts),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title" required><Input required value={form.title} onChange={set("title")} /></Field>
      <Field label="Description"><Input value={form.description} onChange={set("description")} /></Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Duration (min)"><Input type="number" min={5} value={form.durationMinutes} onChange={set("durationMinutes")} /></Field>
        <Field label="Passing score"><Input type="number" min={0} value={form.passingScore} onChange={set("passingScore")} /></Field>
        <Field label="Max attempts"><Input type="number" min={1} value={form.maxAttempts} onChange={set("maxAttempts")} /></Field>
        <Field label="Result strategy">
          <Select value={form.resultStrategy} onChange={set("resultStrategy")}>
            <option value="LATEST_SCORE">Latest score</option>
            <option value="BEST_SCORE">Best score</option>
            <option value="FIRST_SCORE">First score</option>
          </Select>
        </Field>
        <Field label="Access level">
          <Select value={form.accessLevel} onChange={set("accessLevel")}>
            <option value="INVITATION_ONLY">Invitation only</option>
            <option value="PUBLIC">Public</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={set("status")} className="capitalize">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>
      </div>
      <Field label="Skills (comma separated)"><Input value={form.skills} onChange={set("skills")} placeholder="javascript, react, nodejs" /></Field>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.shuffleProblems} onChange={(e) => setBool("shuffleProblems")(e.target.checked)} /> Shuffle problems</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.shuffleOptions} onChange={(e) => setBool("shuffleOptions")(e.target.checked)} /> Shuffle options</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.showResults} onChange={(e) => setBool("showResults")(e.target.checked)} /> Show results to candidate</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.antiCheatingEnabled} onChange={(e) => setBool("antiCheatingEnabled")(e.target.checked)} /> Anti-cheating</label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" loading={saving} size="lg">Save template</Button>
      </div>
    </form>
  );
}
