"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Field, Input, Label, TextField, TextareaField } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import type {
  Difficulty,
  OwnCodingTestCase,
  OwnQuestion,
  OwnQuestionType,
} from "@/lib/competitions/types";
import { useCompetitionsStore } from "@/store/competitions";
import { cn } from "@/lib/utils";

/**
 * Create / edit a company-authored question (requirement 5).
 *
 * One modal covers all three formats — MCQ, coding (starter code + test cases,
 * edited as JSON so hidden cases stay easy to paste) and written answers with a
 * reference answer for the reviewer.
 */

const TYPE_OPTIONS = [
  { value: "MCQ", label: "Multiple choice" },
  { value: "CODING", label: "Coding (auto-graded)" },
  { value: "WRITTEN", label: "Written (manual review)" },
];

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const OPTION_IDS = ["A", "B", "C", "D"];

const DEFAULT_CODING_TESTS = `[
  { "args": [[2, 7, 11, 15], 9], "expected": [0, 1] },
  { "args": [[3, 2, 4], 6], "expected": [1, 2], "isHidden": true }
]`;

const DEFAULT_STARTER = {
  javascript:
    "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction solve(nums, target) {\n  // Write your solution here\n}",
  typescript:
    "function solve(nums: number[], target: number): number[] {\n  // Write your solution here\n}",
};

interface QuestionForm {
  type: OwnQuestionType;
  title: string;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  explanation: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  functionName: string;
  starterJs: string;
  starterTs: string;
  testCases: string;
  referenceAnswer: string;
  maxWords: string;
}

function blankForm(type: OwnQuestionType = "MCQ"): QuestionForm {
  return {
    type,
    title: "",
    topic: "",
    difficulty: "EASY",
    prompt: "",
    explanation: "",
    options: OPTION_IDS.slice(0, 4).map((id) => ({ id, text: "" })),
    correctOptionId: "A",
    functionName: "solve",
    starterJs: DEFAULT_STARTER.javascript,
    starterTs: DEFAULT_STARTER.typescript,
    testCases: DEFAULT_CODING_TESTS,
    referenceAnswer: "",
    maxWords: "150",
  };
}

function formFromQuestion(question: OwnQuestion): QuestionForm {
  const base = blankForm(question.type);
  return {
    ...base,
    title: question.title,
    topic: question.topic,
    difficulty: question.difficulty,
    prompt: question.prompt,
    explanation: question.explanation ?? "",
    options:
      question.options && question.options.length > 0
        ? question.options.map((option) => ({ ...option }))
        : base.options,
    correctOptionId: question.correctOptionId ?? "A",
    functionName: question.coding?.functionName ?? "solve",
    starterJs: question.coding?.starterCode.javascript ?? base.starterJs,
    starterTs: question.coding?.starterCode.typescript ?? base.starterTs,
    testCases: question.coding
      ? JSON.stringify(question.coding.testCases, null, 2)
      : base.testCases,
    referenceAnswer: question.written?.referenceAnswer ?? "",
    maxWords: String(question.written?.maxWords ?? 150),
  };
}

export function QuestionEditorModal({
  open,
  onOpenChange,
  question,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing question to edit, or null/undefined to author a new one. */
  question?: OwnQuestion | null;
  /** Called with the saved question (before the modal closes). */
  onSaved?: (question: OwnQuestion) => void;
}) {
  const upsertQuestion = useCompetitionsStore((state) => state.upsertQuestion);
  const [form, setForm] = useState<QuestionForm>(() => blankForm());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(question ? formFromQuestion(question) : blankForm());
    setError(null);
  }, [open, question]);

  const set = <K extends keyof QuestionForm>(key: K, value: QuestionForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!form.title.trim() || !form.prompt.trim()) {
      setError("A title and a prompt are required.");
      return;
    }

    let testCases: OwnCodingTestCase[] = [];
    if (form.type === "CODING") {
      try {
        const parsed: unknown = JSON.parse(form.testCases || "[]");
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("at least one case");
        testCases = parsed.map((entry) => {
          const testCase = entry as { args?: unknown; expected?: unknown; isHidden?: boolean };
          if (!Array.isArray(testCase.args)) throw new Error("each case needs an `args` array");
          if (testCase.expected === undefined) {
            throw new Error("each case needs an `expected` value");
          }
          return { args: testCase.args, expected: testCase.expected, isHidden: testCase.isHidden };
        });
      } catch (parseError) {
        setError(
          `Test cases must be a JSON array of { args, expected } — ${
            parseError instanceof Error ? parseError.message : "invalid JSON"
          }.`,
        );
        return;
      }
      if (!form.functionName.trim()) {
        setError("Coding questions need a function name for the runner to call.");
        return;
      }
    }

    const next = buildQuestion(form, question, testCases);
    if ("error" in next) {
      setError(next.error);
      return;
    }

        upsertQuestion(next.question);
    toast.success(question ? "Question updated" : "Question added to your bank");
    onSaved?.(next.question);
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg" className="max-h-[90vh] overflow-y-auto thin-scrollbar">
        <ModalHeader>
          <ModalTitle className="text-left text-base font-semibold">
            {question ? "Edit question" : "New question"}
          </ModalTitle>
          <ModalDescription className="text-left text-xs text-muted-foreground">
            {question?.importedFrom
              ? `Forked from ${question.importedFrom} — edit freely, your copy never changes the original.`
              : "Questions you author stay in your bank and can be used in any competition."}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              label="Format"
              value={form.type}
              onValueChange={(value) => set("type", value as OwnQuestionType)}
              options={TYPE_OPTIONS}
              id="question-type"
            />
            <SelectField
              label="Difficulty"
              value={form.difficulty}
              onValueChange={(value) => set("difficulty", value as Difficulty)}
              options={DIFFICULTY_OPTIONS}
              id="question-difficulty"
            />
            <TextField
              label="Topic"
              placeholder="e.g. Arrays"
              value={form.topic}
              onChange={(event) => set("topic", event.target.value)}
              id="question-topic"
            />
          </div>

          <TextField
            label="Title"
            required
            value={form.title}
            onChange={(event) => set("title", event.target.value)}
            id="question-title"
          />

          <TextareaField
            label="Prompt"
            required
            rows={4}
            hint="Inline backticks render as code, e.g. `nums.length`."
            value={form.prompt}
            onChange={(event) => set("prompt", event.target.value)}
            id="question-prompt"
          />

          {form.type === "MCQ" && (
            <div className="space-y-2">
              <Label>Options — pick the correct one</Label>
              {form.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-option"
                    aria-label={`Mark option ${option.id} correct`}
                    checked={form.correctOptionId === option.id}
                    onChange={() => set("correctOptionId", option.id)}
                    className="size-4 accent-primary-600"
                  />
                  <span className="w-5 font-mono text-xs text-muted-foreground">{option.id}</span>
                  <Input
                    value={option.text}
                    placeholder={`Option ${option.id}`}
                    onChange={(event) =>
                      set(
                        "options",
                        form.options.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, text: event.target.value } : entry,
                        ),
                      )
                    }
                  />
                </div>
              ))}
              <TextareaField
                label="Explanation (shown after the competition when enabled)"
                rows={2}
                value={form.explanation}
                onChange={(event) => set("explanation", event.target.value)}
              />
            </div>
          )}

          {form.type === "CODING" && (
            <div className="space-y-3">
              <TextField
                label="Function name the tests call"
                required
                value={form.functionName}
                onChange={(event) => set("functionName", event.target.value)}
              />
              <TextareaField
                label="Starter code — JavaScript"
                rows={5}
                value={form.starterJs}
                onChange={(event) => set("starterJs", event.target.value)}
                className="font-mono text-xs"
              />
              <TextareaField
                label="Starter code — TypeScript"
                rows={5}
                value={form.starterTs}
                onChange={(event) => set("starterTs", event.target.value)}
                className="font-mono text-xs"
              />
              <TextareaField
                label="Test cases (JSON — args + expected, isHidden for the hidden suite)"
                rows={5}
                value={form.testCases}
                onChange={(event) => set("testCases", event.target.value)}
                className="font-mono text-xs"
              />
            </div>
          )}

          {form.type === "WRITTEN" && (
            <div className="space-y-3">
              <TextareaField
                label="Reference answer for the reviewer"
                rows={4}
                value={form.referenceAnswer}
                onChange={(event) => set("referenceAnswer", event.target.value)}
              />
              <TextField
                label="Max words"
                type="number"
                min={10}
                value={form.maxWords}
                onChange={(event) => set("maxWords", event.target.value)}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{question ? "Save changes" : "Add to my bank"}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Builds the stored question from the form, validating per-format rules.
 * Returns `{ error }` instead of throwing so the modal can show it inline.
 */
function buildQuestion(
  form: QuestionForm,
  existing: OwnQuestion | null | undefined,
  testCases: OwnCodingTestCase[],
): { question: OwnQuestion } | { error: string } {
  const now = new Date().toISOString();
  const question: OwnQuestion = {
    id: existing?.id ?? `own-${now}`,
    type: form.type,
    title: form.title.trim(),
    prompt: form.prompt.trim(),
    difficulty: form.difficulty,
    topic: form.topic.trim() || "General",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    importedFrom: existing?.importedFrom,
    explanation: form.explanation.trim() || undefined,
  };

  if (form.type === "MCQ") {
    const options = form.options.filter((option) => option.text.trim());
    if (options.length < 2) return { error: "Add at least two non-empty options." };
    if (!options.some((option) => option.id === form.correctOptionId)) {
      return { error: "Mark one of the options as the correct answer." };
    }
    question.options = options;
    question.correctOptionId = form.correctOptionId;
  }

  if (form.type === "CODING") {
    question.coding = {
      language: "javascript",
      functionName: form.functionName.trim(),
      starterCode: {
        javascript: form.starterJs,
        typescript: form.starterTs.trim() || form.starterJs,
      },
      testCases,
    };
  }

  if (form.type === "WRITTEN") {
    question.written = {
      referenceAnswer: form.referenceAnswer.trim() || undefined,
      maxWords: Number(form.maxWords) || undefined,
    };
  }

  return { question };
}