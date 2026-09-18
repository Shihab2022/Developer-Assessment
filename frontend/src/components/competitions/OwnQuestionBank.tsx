"use client";

import { useMemo, useState } from "react";
import { Clock, FileText, Pencil, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { QuestionEditorModal } from "@/components/competitions/QuestionEditor";
import { useCompetitionsStore } from "@/store/competitions";
import { formatDateTime } from "@/lib/utils";
import type { OwnQuestion, OwnQuestionType } from "@/lib/competitions/types";

const TYPE_TONES: Record<OwnQuestionType, "amber" | "blue" | "violet"> = {
  MCQ: "amber",
  CODING: "blue",
  WRITTEN: "violet",
};


/**
 * Company question bank manager (requirement 5 — author once, reuse in any
 * paper). Create, edit, duplicate and delete MCQ, coding and written
 * questions; library forks land here too.
 */
export function OwnQuestionBank() {
  const ownQuestions = useCompetitionsStore((state) => state.ownQuestions);
  const upsertQuestion = useCompetitionsStore((state) => state.upsertQuestion);
  const removeQuestion = useCompetitionsStore((state) => state.removeQuestion);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<OwnQuestion | undefined>(undefined);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...ownQuestions]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((question) => {
        if (typeFilter && question.type !== typeFilter) return false;
        if (!needle) return true;
        return [question.title, question.topic, question.prompt]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [ownQuestions, query, typeFilter]);

  const duplicate = (question: OwnQuestion) => {
    const now = new Date().toISOString();
    upsertQuestion({
      ...question,
      id: `own-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${question.title} (copy)`,
      importedFrom: undefined,
      createdAt: now,
      updatedAt: now,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your questions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <SelectField
          placeholder="All types"
          value={typeFilter}
          onValueChange={setTypeFilter}
          options={[
            { value: "", label: "All types" },
            { value: "MCQ", label: "Multiple choice" },
            { value: "CODING", label: "Coding" },
            { value: "WRITTEN", label: "Written" },
          ]}
          className="w-40"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <FileText className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-medium text-foreground">
              {ownQuestions.length === 0 ? "No questions yet" : "Nothing matches those filters"}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Write MCQ, coding or written questions once and reuse them in any
              competition paper — or fork one from our library and edit it.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((question) => (
            <Card key={question.id}>
              <CardBody className="flex h-full flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone={TYPE_TONES[question.type]} size="sm">
                    {question.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(question.updatedAt)}
                  </span>
                </div>
                <h3 className="font-medium text-foreground">{question.title}</h3>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {question.topic} · {question.difficulty}
                  {question.importedFrom ? ` · forked from ${question.importedFrom}` : ""}
                </p>
                <div className="mt-auto flex justify-end gap-1 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Edit question"
                    onClick={() => {
                      setEditing(question);
                      setEditorOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Duplicate" onClick={() => duplicate(question)}>
                    <Clock className="hidden size-4" />
                    <span className="text-xs font-medium">Copy</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Delete question"
                    onClick={() => {
                      if (confirm(`Delete "${question.title}"? Papers using it lose that row.`)) {
                        removeQuestion(question.id);
                      }
                    }}
                  >
                    <span className="text-xs font-medium text-destructive">Delete</span>
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <QuestionEditorModal
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditing(undefined);
        }}
        question={editing}
        onSaved={() => setEditing(undefined)}
      />
    </div>
  );
}

export default OwnQuestionBank;

