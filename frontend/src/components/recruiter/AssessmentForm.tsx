"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateAssessment, useUpdateAssessment } from "@/hooks/useAssessments";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextareaField } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { CheckboxField } from "@/components/ui/Checkbox";
import type { Assessment, AssessmentInput } from "@/lib/types";

const ACCESS_LEVELS = ["PUBLIC", "PRIVATE", "INVITATION_ONLY", "ACCESS_CODE"];
const RESULT_STRATEGIES = ["BEST_SCORE", "LATEST_SCORE", "FIRST_SCORE"];

export function AssessmentForm({ assessment }: { assessment?: Assessment }) {
  const router = useRouter();
  const isEdit = Boolean(assessment);
  const create = useCreateAssessment();
  const update = isEdit ? useUpdateAssessment(assessment!.id) : null;

  const [form, setForm] = useState<AssessmentInput>({
    title: assessment?.title ?? "",
    description: assessment?.description ?? "",
    instructions: assessment?.instructions ?? "",
    durationMinutes: assessment?.durationMinutes ?? 60,
    passingScore: assessment?.passingScore ?? 60,
    maxAttempts: assessment?.maxAttempts ?? 1,
    shuffleProblems: assessment?.shuffleProblems ?? true,
    shuffleOptions: assessment?.shuffleOptions ?? true,
    showResults: assessment?.showResults ?? true,
    antiCheatingEnabled: assessment?.antiCheatingEnabled ?? true,
    resultStrategy: assessment?.resultStrategy ?? "BEST_SCORE",
    accessLevel: assessment?.accessLevel ?? "INVITATION_ONLY",
    accessCode: "",
    showCandidateRanking: assessment?.showCandidateRanking ?? false,
    startDate: assessment?.startDate ?? null,
    endDate: assessment?.endDate ?? null,
  });

  const set = <K extends keyof AssessmentInput>(key: K, value: AssessmentInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const pending = create.isPending || Boolean(update?.isPending);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.accessCode) delete payload.accessCode;
    if (isEdit) {
      update!.mutate(payload, {
        onSuccess: () => router.push(`/recruiter/assessments/${assessment!.id}`),
      });
    } else {
      create.mutate(payload, {
        onSuccess: (a) => router.push(`/recruiter/assessments/${a.id}`),
      });
    }
  };
  return (
    <>
      <PageHeader
        title={isEdit ? `Edit: ${assessment!.title}` : "Create assessment"}
        subtitle={isEdit ? "Update assessment settings" : "Configure the basics — you can add problems next"}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Cancel
          </Button>
        }
      />
      <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
        <Card>
          <CardBody className="space-y-4">
            <TextField              label="Title"
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Senior Frontend Engineer — take-home"
            />
            <TextareaField              label="Description"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
            />
            <TextareaField              label="Instructions"
              value={form.instructions ?? ""}
              onChange={(e) => set("instructions", e.target.value)}
              rows={4}
              placeholder="Shown to candidates before they start the attempt"
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <TextField              label="Duration (minutes)"
              type="number"
              min={5}
              required
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", Number(e.target.value))}
            />
            <TextField              label="Passing score (%)"
              type="number"
              min={0}
              max={100}
              value={form.passingScore ?? 60}
              onChange={(e) => set("passingScore", Number(e.target.value))}
            />
            <TextField              label="Max attempts"
              type="number"
              min={1}
              value={form.maxAttempts ?? 1}
              onChange={(e) => set("maxAttempts", Number(e.target.value))}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Access level"
              value={form.accessLevel}
              onValueChange={(v) => set("accessLevel", v as AssessmentInput["accessLevel"])}
              options={ACCESS_LEVELS.map((v) => ({ value: v, label: v.replace(/_/g, " ") }))}
            />
            <SelectField
              label="Result strategy"
              value={form.resultStrategy}
              onValueChange={(v) => set("resultStrategy", v as AssessmentInput["resultStrategy"])}
              options={RESULT_STRATEGIES.map((v) => ({ value: v, label: v.replace(/_/g, " ") }))}
            />
            {form.accessLevel === "ACCESS_CODE" && (
              <TextField                label="Access code"
                value={form.accessCode ?? ""}
                onChange={(e) => set("accessCode", e.target.value)}
                placeholder={isEdit ? "Leave blank to keep current code" : "Required for access-code assessments"}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="grid gap-3 sm:grid-cols-2">
            <CheckboxField
              label="Shuffle problem order"
              checked={form.shuffleProblems ?? true}
              onCheckedChange={(c) => set("shuffleProblems", c)}
            />
            <CheckboxField
              label="Shuffle MCQ option order"
              checked={form.shuffleOptions ?? true}
              onCheckedChange={(c) => set("shuffleOptions", c)}
            />
            <CheckboxField
              label="Show results to candidates"
              checked={form.showResults ?? true}
              onCheckedChange={(c) => set("showResults", c)}
            />
            <CheckboxField
              label="Anti-cheating monitor"
              checked={form.antiCheatingEnabled ?? true}
              onCheckedChange={(c) => set("antiCheatingEnabled", c)}
            />
            <CheckboxField
              label="Show candidate ranking"
              checked={form.showCandidateRanking ?? false}
              onCheckedChange={(c) => set("showCandidateRanking", c)}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={pending || !form.title}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create assessment"}
          </Button>
        </div>
      </form>
    </>
  );
}

