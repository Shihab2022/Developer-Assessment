"use client";

import { useState } from "react";
import { useProblems, useCreateProblem, useDeleteProblem, useUpdateProblem } from "@/hooks/useProblems";
import { useCurrentUser } from "@/store/auth";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, DifficultyBadge, TypeBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { CheckboxField } from "@/components/ui/Checkbox";
import { TextField, TextareaField } from "@/components/ui/Input";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Primitives";
import { Trash2, Plus, Pencil, Building2, X } from "lucide-react";
import type { CodingTestCase, MCQOption, Problem, ProblemInput } from "@/lib/types";

const TYPES = ["CODING", "MCQ", "WRITTEN"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

type SourceTab = "all" | "mine" | "platform";

const SOURCE_TABS: { value: SourceTab; label: string; hint: string }[] = [
  { value: "all", label: "All questions", hint: "Your bank plus the shared platform library" },
  { value: "mine", label: "My questions", hint: "Questions created by you or your company" },
  { value: "platform", label: "Platform library", hint: "Ready-made questions maintained by us" },
];

export default function ProblemsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tab, setTab] = useState<SourceTab>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Problem | null>(null);
  const me = useCurrentUser();

  const { data, isLoading } = useProblems({
    q: q || undefined,
    type: (type || undefined) as ProblemInput["type"],
    difficulty: (difficulty || undefined) as ProblemInput["difficulty"],
    scope: tab,
    limit: 50,
  });
  const del = useDeleteProblem();
  const problems = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Question bank"
        subtitle="Coding, multiple-choice and written problems reused across assessments"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New problem
          </Button>
        }
      />
      <div className="mb-4 flex gap-1 border-b border-border">
        {SOURCE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            title={t.hint}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.value
                ? "border-b-2 border-primary-600 text-primary-700 dark:text-primary-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Search problems..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <SelectField
              placeholder="All types"
              value={type}
              onValueChange={setType}
              options={TYPES.map((t) => ({ value: t, label: t }))}
              className="w-36"
            />
            <SelectField
              placeholder="All difficulties"
              value={difficulty}
              onValueChange={setDifficulty}
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
              className="w-36"
            />
          </div>

          {isLoading ? (
            <Spinner className="mx-auto my-10" />
          ) : problems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tab === "platform"
                ? "The shared platform library is empty for now — create your own first question."
                : "No problems found. Create your first problem or switch tabs to browse the platform library."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Title</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Difficulty</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Source</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Points</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{p.title}</p>
                      {p.description && (
                        <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3"><TypeBadge type={p.type} /></td>
                    <td className="py-3"><DifficultyBadge difficulty={p.difficulty} /></td>
                    <td className="py-3">
                      <SourceLabel problem={p} meId={me?.id} myCompanyId={me?.companyId} />
                    </td>
                    <td className="py-3 text-right tabular-nums">{p.points}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {(p.createdBy === me?.id || (me?.companyId != null && p.companyId === me.companyId)) && (
                          <Button
                            variant="ghost" size="sm"
                            title="Edit content"
                            onClick={() => setEditing(p)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }}
                          disabled={del.isPending}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <CreateProblemModal open={createOpen} onOpenChange={setCreateOpen} />
      <EditProblemModal problem={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function SourceLabel({
  problem, meId, myCompanyId,
}: {
  problem: Problem;
  meId?: string;
  myCompanyId?: string | null;
}) {
  if (!problem.companyId) {
    return (
      <Badge tone="blue" size="sm" title="Maintained by the platform">
        <Building2 className="mr-1 size-3" /> Platform
      </Badge>
    );
  }
  if (problem.createdBy === meId || (myCompanyId != null && problem.companyId === myCompanyId)) {
    return <Badge tone="green" size="sm">Mine</Badge>;
  }
  return <Badge tone="gray" size="sm">Company</Badge>;
}

function CreateProblemModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateProblem();
  const [form, setForm] = useState<ProblemInput>({
    title: "",
    description: "",
    type: "CODING",
    difficulty: "MEDIUM",
    points: 10,
  });
  const [testCases, setTestCases] = useState<CodingTestCase[]>([
    { input: "", expectedOutput: "", isHidden: false, order: 0 },
  ]);
  const [options, setOptions] = useState<(MCQOption & { id: string })[]>([
    { id: "a", text: "", isCorrect: true, order: 0 },
    { id: "b", text: "", isCorrect: false, order: 1 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const reset = () => {
    setForm({ title: "", description: "", type: "CODING", difficulty: "MEDIUM", points: 10 });
    setTestCases([{ input: "", expectedOutput: "", isHidden: false, order: 0 }]);
    setOptions([
      { id: "a", text: "", isCorrect: true, order: 0 },
      { id: "b", text: "", isCorrect: false, order: 1 },
    ]);
    setFormError(null);
  };

  const submit = () => {
    const payload: ProblemInput = { ...form };
    if (form.type === "CODING") {
      const rows = testCases.filter(
        (tc) => tc.input.trim() !== "" || tc.expectedOutput.trim() !== "",
      );
      if (rows.length === 0) {
        setFormError("CODING problems require at least 1 test case — add an input and its expected output.");
        return;
      }
      payload.testCases = rows.map((tc, i) => ({ ...tc, order: i }));
    }
    if (form.type === "MCQ") {
      const rows = options.filter((o) => o.text.trim() !== "");
      if (rows.length < 2) {
        setFormError("MCQ problems require at least 2 non-empty options.");
        return;
      }
      if (!rows.some((o) => o.isCorrect)) {
        setFormError("MCQ problems require exactly one correct option.");
        return;
      }
      payload.options = rows.map((row, i) => ({
        text: row.text,
        isCorrect: row.isCorrect,
        order: i,
      }));
    }
    if (form.type === "WRITTEN" && !(form.expectedAnswer ?? "").toString().trim()) {
      setFormError("WRITTEN problems require an expected answer or marking criteria.");
      return;
    }
    setFormError(null);
    create.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        reset();
      },
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader title="New problem" />
        <div className="space-y-4 p-4">
          <TextField
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextareaField
            label="Description"
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-3 gap-3">
            <SelectField
              label="Type"
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v as ProblemInput["type"] })}
              options={TYPES.map((t) => ({ value: t, label: t }))}
            />
            <SelectField
              label="Difficulty"
              value={form.difficulty}
              onValueChange={(v) => setForm({ ...form, difficulty: v as ProblemInput["difficulty"] })}
              options={DIFFICULTIES.map((d) => ({ value: d, label: d }))}
            />
            <TextField
              label="Points"
              type="number"
              min={1}
              value={form.points ?? 10}
              onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
            />
          </div>

          {form.type === "CODING" && (
            <TestCaseEditor testCases={testCases} onChange={setTestCases} />
          )}
          {form.type === "MCQ" && (
            <OptionEditor options={options} onChange={setOptions} />
          )}
          {form.type === "WRITTEN" && (
            <TextareaField
              label="Expected answer / marking criteria"
              required
              rows={4}
              value={(form.expectedAnswer as string) ?? ""}
              onChange={(e) => setForm({ ...form, expectedAnswer: e.target.value })}
              hint="Graders use this when scoring the written answer."
            />
          )}

          {formError && (
            <p role="alert" className="text-sm text-destructive">{formError}</p>
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.title || !form.description || create.isPending}>
            {create.isPending ? "Creating…" : "Create problem"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function TestCaseEditor({
  testCases,
  onChange,
}: {
  testCases: CodingTestCase[];
  onChange: (next: CodingTestCase[]) => void;
}) {
  const update = (index: number, patch: Partial<CodingTestCase>) =>
    onChange(testCases.map((tc, i) => (i === index ? { ...tc, ...patch } : tc)));
  const remove = (index: number) =>
    onChange(testCases.filter((_, i) => i !== index));
  const add = () =>
    onChange([
      ...testCases,
      { input: "", expectedOutput: "", isHidden: false, order: testCases.length },
    ]);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Test cases <span className="text-destructive">*</span>
        </p>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="size-3.5" /> Add case
        </Button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        CODING problems require at least 1 test case. Mark unrevealed cases as hidden.
      </p>
      <div className="space-y-3">
        {testCases.map((tc, i) => (
          <div key={i} className="rounded-lg bg-muted/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Case {i + 1}</span>
              <div className="flex items-center gap-2">
                <CheckboxField
                  label="Hidden"
                  checked={tc.isHidden ?? false}
                  onCheckedChange={(c) => update(i, { isHidden: c })}
                />
                <Button
                  variant="ghost" size="sm"
                  onClick={() => remove(i)}
                  disabled={testCases.length === 1}
                  aria-label="Remove test case"
                >
                  <X className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <TextareaField
                label="Input"
                rows={2}
                value={tc.input}
                onChange={(e) => update(i, { input: e.target.value })}
                placeholder="stdin for this case"
              />
              <TextareaField
                label="Expected output"
                rows={2}
                value={tc.expectedOutput}
                onChange={(e) => update(i, { expectedOutput: e.target.value })}
                placeholder="Exact expected stdout"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionEditor({
  options,
  onChange,
}: {
  options: (MCQOption & { id: string })[];
  onChange: (next: (MCQOption & { id: string })[]) => void;
}) {
  const update = (id: string, patch: Partial<MCQOption & { id: string }>) =>
    onChange(options.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const remove = (id: string) => onChange(options.filter((o) => o.id !== id));
  const add = () =>
    onChange([
      ...options,
      {
        id: `opt-${Date.now()}-${options.length}`,
        text: "",
        isCorrect: false,
        order: options.length,
      },
    ]);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Answer options <span className="text-destructive">*</span>
        </p>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="size-3.5" /> Add option
        </Button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        MCQ problems require at least 2 options with exactly one marked correct.
      </p>
      <div className="space-y-2">
        {options.map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            <CheckboxField
              label="Correct"
              checked={o.isCorrect ?? false}
              onCheckedChange={(c) =>
                onChange(options.map((x) => ({ ...x, isCorrect: x.id === o.id ? c : c ? false : x.isCorrect })))
              }
            />
            <Input
              placeholder="Answer option"
              value={o.text}
              onChange={(e) => update(o.id, { text: e.target.value })}
              className="flex-1"
            />
            <Button
              variant="ghost" size="sm"
              onClick={() => remove(o.id)}
              disabled={options.length <= 2}
              aria-label="Remove option"
            >
              <X className="size-3.5 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProblemModal({
  problem,
  onClose,
}: {
  problem: Problem | null;
  onClose: () => void;
}) {
  const updateMutation = useUpdateProblem(problem?.id ?? "");
  const [form, setForm] = useState({ points: 10, timeLimit: "", memoryLimit: "" });

  if (!problem) return null;

  const submit = () => {
    updateMutation.mutate(
      {
        points: Number(form.points) || problem.points,
        timeLimit: form.timeLimit === "" ? undefined : Number(form.timeLimit),
        memoryLimit: form.memoryLimit === "" ? undefined : Number(form.memoryLimit),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title={`Edit: ${problem.title}`} />
        <div className="space-y-4 p-4">
          <p className="text-xs text-muted-foreground">
            Only scoring metadata can be changed after creation; the statement,
            test cases and options are fixed to keep existing assessments stable.
          </p>
          <TextField
            label="Points"
            type="number"
            min={1}
            value={form.points}
            onChange={(e) => setForm({ ...form, points: Number(e.target.value) })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Time limit (s)"
              type="number"
              min={1}
              value={form.timeLimit}
              onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
              placeholder={problem.timeLimit != null ? String(problem.timeLimit) : "—"}
            />
            <TextField
              label="Memory limit (MB)"
              type="number"
              min={1}
              value={form.memoryLimit}
              onChange={(e) => setForm({ ...form, memoryLimit: e.target.value })}
              placeholder={problem.memoryLimit != null ? String(problem.memoryLimit) : "—"}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}