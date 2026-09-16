"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { CodingTestCase, MCQOption, Problem } from "@/lib/types";
import { DIFFICULTIES, PROBLEM_STATUSES, PROGRAMMING_LANGUAGES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function ProblemForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Problem | null;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [type, setType] = useState<string>(initial?.type ?? "MCQ");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "EASY");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [points, setPoints] = useState(initial?.points ?? 5);
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [tags, setTags] = useState(
    Array.isArray(initial?.tags) ? initial!.tags!.map((t: string | { name: string }) => (typeof t === "string" ? t : t.name)).join(", ") : "",
  );
  const [skills, setSkills] = useState((initial?.skills ?? []).join(", "));

  // MCQ
  const [options, setOptions] = useState<MCQOption[]>(
    initial?.options?.length
      ? initial.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order }))
      : [
          { text: "", isCorrect: true, order: 0 },
          { text: "", isCorrect: false, order: 1 },
        ],
  );

  // Coding
  const [timeLimit, setTimeLimit] = useState(initial?.timeLimit ?? 2000);
  const [memoryLimit, setMemoryLimit] = useState(initial?.memoryLimit ?? 256);
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(initial?.allowedLanguages ?? ["javascript", "python"]);
  const [testCases, setTestCases] = useState<CodingTestCase[]>(
    initial?.testCases?.length
      ? initial.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden, order: tc.order }))
      : [{ input: "", expectedOutput: "", isHidden: false, order: 0 }],
  );

  // Written
  const [expectedAnswer, setExpectedAnswer] = useState(initial?.expectedAnswer ?? "");

  const toggleLanguage = (lang: string) =>
    setAllowedLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      title,
      description,
      type,
      difficulty,
      category: category || undefined,
      points: Number(points),
      status,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      skills: skills.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (type === "MCQ") {
      if (options.filter((o) => o.text.trim()).length < 2) {
        toast.error("MCQ needs at least 2 non-empty options");
        return;
      }
      if (!options.some((o) => o.isCorrect && o.text.trim())) {
        toast.error("Mark at least one non-empty option as correct");
        return;
      }
      body.options = options
        .filter((o) => o.text.trim())
        .map((o, i) => ({ text: o.text.trim(), isCorrect: o.isCorrect, order: i }));
    }
    if (type === "CODING") {
      body.timeLimit = Number(timeLimit);
      body.memoryLimit = Number(memoryLimit);
      body.allowedLanguages = allowedLanguages;
      body.testCases = testCases
        .filter((tc) => tc.input.trim() && tc.expectedOutput.trim())
        .map((tc, i) => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden, order: i }));
    }
    if (type === "WRITTEN") {
      body.expectedAnswer = expectedAnswer;
    }
    try {
      await onSubmit(body);
    } catch {
      /* toast handled by caller */
    }
  };

return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader title="Problem details" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Two Sum" />
          </Field>
          <Field label="Description / question" required className="sm:col-span-2">
            <Textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "CODING" ? "Full problem statement, input/output format…" : "The question asked to the candidate"} />
          </Field>
          <Field label="Type" required>
            <Select value={type} onChange={(e) => setType(e.target.value)} disabled={!!initial}>
              {["MCQ", "CODING", "WRITTEN"].map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Difficulty" required>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="Category" hint="e.g. algorithms, javascript, api-design">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Points" required>
            <Input type="number" min={1} required value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </Field>
          <Field label="Tags" hint="Comma-separated">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="arrays, hashmap" />
          </Field>
          <Field label="Skills" hint="Comma-separated — used in skill reports">
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="javascript, algorithms" />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PROBLEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </CardBody>
      </Card>

{type === "MCQ" && (
        <Card>
          <CardHeader
            title="Answer options"
            subtitle="Select the radio button of the correct option"
            action={
              <Button size="sm" variant="outline" onClick={() => setOptions((o) => [...o, { text: "", isCorrect: false, order: o.length }])}>
                <Plus className="h-4 w-4" /> Add option
              </Button>
            }
          />
          <CardBody className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.map((o, j) => ({ ...o, isCorrect: i === j })))}
                  title="Mark as correct"
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                    opt.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400 hover:border-emerald-400",
                  )}
                >
                  ✓
                </button>
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={opt.text}
                  onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)))}
                />
                <Button type="button" size="icon" variant="ghost" disabled={options.length <= 2} onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove option">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {type === "CODING" && (
        <Card>
          <CardHeader
            title="Test cases"
            subtitle="Public cases are visible to candidates; hidden cases are used for scoring"
            action={
              <Button size="sm" variant="outline" onClick={() => setTestCases((tc) => [...tc, { input: "", expectedOutput: "", isHidden: false, order: tc.length }])}>
                <Plus className="h-4 w-4" /> Add test case
              </Button>
            }
          />
          <CardBody className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Time limit (ms)"><Input type="number" min={100} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} /></Field>
              <Field label="Memory limit (MB)"><Input type="number" min={16} value={memoryLimit} onChange={(e) => setMemoryLimit(Number(e.target.value))} /></Field>
              <Field label="Allowed languages" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2 pt-1">
                  {PROGRAMMING_LANGUAGES.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => toggleLanguage(l.value)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition",
                        allowedLanguages.includes(l.value) ? "bg-primary-600 text-white ring-primary-600" : "bg-white text-slate-600 ring-slate-300 hover:ring-primary-400",
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            {testCases.map((tc, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Test case {i + 1}</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input type="checkbox" checked={!tc.isHidden} onChange={(e) => setTestCases((prev) => prev.map((t, j) => (j === i ? { ...t, isHidden: !e.target.checked } : t)))} />
                      Visible to candidates
                    </label>
                    <Button type="button" size="icon" variant="ghost" disabled={testCases.length <= 1} onClick={() => setTestCases((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Input (stdin)">
                    <Textarea rows={2} className="font-mono text-xs" value={tc.input} onChange={(e) => setTestCases((prev) => prev.map((t, j) => (j === i ? { ...t, input: e.target.value } : t)))} />
                  </Field>
                  <Field label="Expected output">
                    <Textarea rows={2} className="font-mono text-xs" value={tc.expectedOutput} onChange={(e) => setTestCases((prev) => prev.map((t, j) => (j === i ? { ...t, expectedOutput: e.target.value } : t)))} />
                  </Field>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {type === "WRITTEN" && (
        <Card>
          <CardHeader title="Evaluation guidance" subtitle="Reference answer / criteria for the recruiter scoring this answer" />
          <CardBody>
            <Field label="Expected answer">
              <Textarea rows={6} value={expectedAnswer} onChange={(e) => setExpectedAnswer(e.target.value)} placeholder="Model answer or grading rubric…" />
            </Field>
          </CardBody>
        </Card>
      )}


      <div className="flex justify-end">
        <Button type="submit" size="lg">{submitLabel}</Button>
      </div>
    </form>
  );
}

}
