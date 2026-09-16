"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ACCESS_LEVELS, RESULT_STRATEGIES } from "@/lib/constants";
import type { Assessment } from "@/lib/types";

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface AssessmentFormValues {
  title: string; description: string; instructions: string;
  durationMinutes: number; passingScore: number; startDate: string; endDate: string;
  maxAttempts: number; shuffleProblems: boolean; shuffleOptions: boolean; showResults: boolean;
  antiCheatingEnabled: boolean; showCandidateRanking: boolean;
  resultStrategy: string; accessLevel: string;
}

const defaults: AssessmentFormValues = {
  title: "", description: "", instructions: "", durationMinutes: 45, passingScore: 50,
  startDate: "", endDate: "", maxAttempts: 1, shuffleProblems: false, shuffleOptions: false,
  showResults: true, antiCheatingEnabled: true, showCandidateRanking: true,
  resultStrategy: "LATEST_SCORE", accessLevel: "INVITATION_ONLY",
};

export function AssessmentForm({
  initial, submitLabel, onSubmit,
}: {
  initial?: Assessment | null;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [v, setV] = useState<AssessmentFormValues>(() => {
    if (!initial) return defaults;
    return {
      title: initial.title ?? "", description: initial.description ?? "", instructions: initial.instructions ?? "",
      durationMinutes: initial.durationMinutes ?? 45, passingScore: initial.passingScore ?? 50,
      startDate: toLocalInput(initial.startDate), endDate: toLocalInput(initial.endDate),
      maxAttempts: initial.maxAttempts ?? 1, shuffleProblems: !!initial.shuffleProblems,
      shuffleOptions: !!initial.shuffleOptions, showResults: !!initial.showResults,
      antiCheatingEnabled: !!initial.antiCheatingEnabled, showCandidateRanking: !!initial.showCandidateRanking,
      resultStrategy: initial.resultStrategy ?? "LATEST_SCORE", accessLevel: initial.accessLevel ?? "INVITATION_ONLY",
    };
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof AssessmentFormValues>(k: K, value: AssessmentFormValues[K]) =>
    setV((p) => ({ ...p, [k]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...v,
        durationMinutes: Number(v.durationMinutes),
        passingScore: Number(v.passingScore),
        maxAttempts: Number(v.maxAttempts),
        startDate: v.startDate ? new Date(v.startDate).toISOString() : undefined,
        endDate: v.endDate ? new Date(v.endDate).toISOString() : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader title="Basics" subtitle="What candidates will see" />
        <CardBody className="space-y-4">
          <Field label="Title" required>
            <Input required value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Junior Node.js Developer Assessment" />
          </Field>
          <Field label="Description">
            <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Short summary shown to candidates" />
          </Field>
          <Field label="Instructions">
            <Textarea value={v.instructions} onChange={(e) => set("instructions", e.target.value)} placeholder="Rules, structure, expectations…" />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Timing & scoring" subtitle="The server enforces the timer and passing score" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Duration (minutes)" required>
            <Input type="number" min={1} required value={v.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} />
          </Field>
          <Field label="Passing score (points)" required>
            <Input type="number" min={0} required value={v.passingScore} onChange={(e) => set("passingScore", Number(e.target.value))} />
          </Field>
          <Field label="Max attempts per candidate" required>
            <Input type="number" min={1} required value={v.maxAttempts} onChange={(e) => set("maxAttempts", Number(e.target.value))} />
          </Field>
          <Field label="Result strategy" hint="How multiple attempts are scored">
            <Select value={v.resultStrategy} onChange={(e) => set("resultStrategy", e.target.value)}>
              {RESULT_STRATEGIES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
            </Select>
          </Field>
          <Field label="Start date (optional)">
            <Input type="datetime-local" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
          <Field label="End date (optional)">
            <Input type="datetime-local" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Behaviour & security" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Toggle label="Shuffle problems" checked={v.shuffleProblems} onChange={(x) => set("shuffleProblems", x)} />
          <Toggle label="Shuffle MCQ options" checked={v.shuffleOptions} onChange={(x) => set("shuffleOptions", x)} />
          <Toggle label="Show results to candidates" checked={v.showResults} onChange={(x) => set("showResults", x)} />
          <Toggle label="Anti-cheating proctoring" description="Log tab switches, copy/paste, fullscreen exits" checked={v.antiCheatingEnabled} onChange={(x) => set("antiCheatingEnabled", x)} />
          <Toggle label="Show candidate ranking" checked={v.showCandidateRanking} onChange={(x) => set("showCandidateRanking", x)} />
          <Field label="Access level">
            <Select value={v.accessLevel} onChange={(e) => set("accessLevel", e.target.value)}>
              {ACCESS_LEVELS.map((a) => <option key={a} value={a}>{a.replaceAll("_", " ")}</option>)}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving} size="lg">{submitLabel}</Button>
      </div>

    </form>
  );
}
