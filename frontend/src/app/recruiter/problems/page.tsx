"use client";

import { useState } from "react";
import { useProblems, useCreateProblem, useDeleteProblem } from "@/hooks/useProblems";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DifficultyBadge, TypeBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { TextField, TextareaField } from "@/components/ui/Input";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Primitives";
import { Trash2, Plus } from "lucide-react";
import type { ProblemInput } from "@/lib/types";

const TYPES = ["CODING", "MCQ", "WRITTEN"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

export default function ProblemsPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useProblems({
    q: q || undefined,
    type: (type || undefined) as ProblemInput["type"],
    difficulty: (difficulty || undefined) as ProblemInput["difficulty"],
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
              No problems found. Create your first problem.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Title</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Difficulty</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Points</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-foreground">{p.title}</td>
                    <td className="py-3"><TypeBadge type={p.type} /></td>
                    <td className="py-3"><DifficultyBadge difficulty={p.difficulty} /></td>
                    <td className="py-3 text-right tabular-nums">{p.points}</td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id); }}
                        disabled={del.isPending}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <CreateProblemModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
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

  const submit = () => {
    create.mutate(form, {
      onSuccess: () => {
        onOpenChange(false);
        setForm({ title: "", description: "", type: "CODING", difficulty: "MEDIUM", points: 10 });
      },
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="md">
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
