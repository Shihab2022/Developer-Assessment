"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/Modal";
import { LIBRARY_PROBLEMS, LIBRARY_TECHNOLOGIES } from "@/lib/competitions/library";
import { pickLibraryQuestions } from "@/lib/competitions/paper";
import type { OwnQuestion, PaperSource } from "@/lib/competitions/types";
import type { QuestionBank } from "@/lib/question-banks/types";
import { loadBank } from "@/lib/question-banks/load";
import { hashSeed } from "@/lib/question-banks/sample";
import { cn } from "@/lib/utils";

/**
 * Source picker for the competition builder (requirements 4 & 5).
 *
 * Three tabs — our MCQ banks, our coding problems, and the host's own bank.
 * MCQ questions load one technology at a time (`loadBank`) so the picker never
 * drags all eight banks into the bundle, and "auto pick" reuses the same seeded
 * sampler as the exams so the draw is reproducible.
 */

export interface NewPaperItem {
  source: PaperSource;
  technology?: string;
  questionId?: string;
  problemId?: string;
  ownId?: string;
  label: string;
}

type Tab = "mcq" | "coding" | "own";

const TABS: { id: Tab; label: string }[] = [
  { id: "mcq", label: "MCQ bank" },
  { id: "coding", label: "Coding problems" },
  { id: "own", label: "My questions" },
];

const DIFFICULTY_OPTIONS = [
  { value: "ALL", label: "All difficulties" },
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

export function LibraryPickerModal({
  open,
  onOpenChange,
  onAdd,
  ownQuestions,
  initialTab = "mcq",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (items: NewPaperItem[]) => void;
  ownQuestions: OwnQuestion[];
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  /* MCQ state */
  const [technology, setTechnology] = useState("javascript");
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [loadingBank, setLoadingBank] = useState(false);
  const [difficulty, setDifficulty] = useState("ALL");
  const [topic, setTopic] = useState("ALL");
  const [count, setCount] = useState(5);
  const [picked, setPicked] = useState<string[]>([]);

  /* Coding + own state */
  const [search, setSearch] = useState("");
  const [pickedProblems, setPickedProblems] = useState<string[]>([]);
  const [pickedOwn, setPickedOwn] = useState<string[]>([]);

  // Load the selected bank whenever the MCQ tab is shown.
  useEffect(() => {
    if (!open || tab !== "mcq") return;
    let cancelled = false;
    setLoadingBank(true);
    loadBank(technology)
      .then((loaded) => {
        if (!cancelled) setBank(loaded);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingBank(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, technology]);

  // Clear selections when the modal closes so reopening starts fresh.
  useEffect(() => {
    if (open) return;
    setPicked([]);
    setPickedProblems([]);
    setPickedOwn([]);
    setSearch("");
  }, [open]);

  const topicOptions = useMemo(
    () => [
      { value: "ALL", label: "All topics" },
      ...(bank?.topics ?? []).map((value) => ({ value, label: value })),
    ],
    [bank],
  );

  const filteredQuestions = useMemo(() => {
    if (!bank) return [];
    return bank.questions.filter((question) => {
      if (difficulty !== "ALL" && question.difficulty !== difficulty) return false;
      if (topic !== "ALL" && question.topic !== topic) return false;
      return true;
    });
  }, [bank, difficulty, topic]);

  const filteredProblems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return LIBRARY_PROBLEMS;
    return LIBRARY_PROBLEMS.filter(
      (problem) =>
        problem.title.toLowerCase().includes(needle) ||
        problem.topics.some((entry) => entry.toLowerCase().includes(needle)),
    );
  }, [search]);

  const filteredOwn = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return ownQuestions;
    return ownQuestions.filter(
      (question) =>
        question.title.toLowerCase().includes(needle) ||
        question.topic.toLowerCase().includes(needle),
    );
  }, [ownQuestions, search]);

  const toggle = (list: string[], id: string): string[] =>
    list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id];

  const addAuto = () => {
    if (!bank) return;
    const ids = pickLibraryQuestions(bank, {
      count,
      difficulty: difficulty === "ALL" ? undefined : difficulty,
      topics: topic === "ALL" ? undefined : [topic],
      seed: hashSeed(`${bank.technology}-${Date.now()}`),
    });
    onAdd(
      ids.map((questionId) => ({
        source: "library-mcq" as PaperSource,
        technology: bank.technology,
        questionId,
        label: mcqLabel(bank, questionId),
      })),
    );
    onOpenChange(false);
  };

  const addPicked = () => {
    if (!bank || picked.length === 0) return;
    onAdd(
      picked.map((questionId) => ({
        source: "library-mcq" as PaperSource,
        technology: bank.technology,
        questionId,
        label: mcqLabel(bank, questionId),
      })),
    );
    onOpenChange(false);
  };

  const addProblems = () => {
    if (pickedProblems.length === 0) return;
    onAdd(
      pickedProblems.map((problemId) => ({
        source: "library-coding" as PaperSource,
        problemId,
        label: LIBRARY_PROBLEMS.find((problem) => problem.id === problemId)?.title ?? problemId,
      })),
    );
    onOpenChange(false);
  };

  const addOwn = () => {
    if (pickedOwn.length === 0) return;
    onAdd(
      pickedOwn.map((ownId) => ({
        source: "own" as PaperSource,
        ownId,
        label: ownQuestions.find((question) => question.id === ownId)?.title ?? ownId,
      })),
    );
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="xl" className="max-h-[90vh] overflow-hidden">
        <ModalHeader>
          <ModalTitle className="text-left text-base font-semibold">Add questions</ModalTitle>
          <ModalDescription className="text-left text-xs text-muted-foreground">
            Mix our question banks, our coding problems and your own questions in one paper.
          </ModalDescription>
        </ModalHeader>

        <div className="flex items-center gap-1 border-b border-border pb-2">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                tab === entry.id
                  ? "bg-primary-600 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="thin-scrollbar max-h-[52vh] overflow-y-auto pr-1">
          {tab === "mcq" && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectField
                  label="Technology"
                  value={technology}
                  onValueChange={setTechnology}
                  options={LIBRARY_TECHNOLOGIES.map((entry) => ({
                    value: entry.id,
                    label: entry.label,
                  }))}
                  id="picker-technology"
                />
                <SelectField
                  label="Difficulty"
                  value={difficulty}
                  onValueChange={setDifficulty}
                  options={DIFFICULTY_OPTIONS}
                  id="picker-difficulty"
                />
                <SelectField
                  label="Topic"
                  value={topic}
                  onValueChange={setTopic}
                  options={topicOptions}
                  id="picker-topic"
                />
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  Random draw
                  <Input
                    type="number"
                    min={1}
                    max={40}
                    value={count}
                    onChange={(event) => setCount(Math.max(1, Number(event.target.value) || 1))}
                    className="h-9 w-20"
                  />
                </label>
                <Button size="sm" onClick={addAuto} disabled={!bank || loadingBank}>
                  <Plus />
                  Add {count} random
                </Button>
                <Button size="sm" variant="outline" onClick={addPicked} disabled={picked.length === 0}>
                  <Check />
                  Add selected ({picked.length})
                </Button>
              </div>

              {loadingBank || !bank ? (
                <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading {technology} questions…
                </p>
              ) : (
                <SelectableList
                  items={filteredQuestions.map((question) => ({
                    id: question.id,
                    title: question.title,
                    meta: question.topic,
                    difficulty: question.difficulty,
                  }))}
                  picked={picked}
                  onToggle={(id) => setPicked((current) => toggle(current, id))}
                />
              )}
            </div>
          )}

          {tab === "coding" && (
            <div className="space-y-3">
              <SearchBar
                value={search}
                placeholder="Search problems or topics…"
                onChange={setSearch}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addProblems}
                    disabled={pickedProblems.length === 0}
                  >
                    <Check />
                    Add selected ({pickedProblems.length})
                  </Button>
                }
              />
              <SelectableList
                items={filteredProblems.map((problem) => ({
                  id: problem.id,
                  title: `${problem.number}. ${problem.title}`,
                  meta: problem.topics.join(", "),
                  difficulty: problem.difficulty,
                }))}
                picked={pickedProblems}
                onToggle={(id) => setPickedProblems((current) => toggle(current, id))}
              />
            </div>
          )}

          {tab === "own" && (
            <div className="space-y-3">
              <SearchBar
                value={search}
                placeholder="Search your questions…"
                onChange={setSearch}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addOwn}
                    disabled={pickedOwn.length === 0}
                  >
                    <Check />
                    Add selected ({pickedOwn.length})
                  </Button>
                }
              />
              {filteredOwn.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Your bank is empty. Author questions on the “My questions” page or import a few
                  from the library first.
                </p>
              ) : (
                <SelectableList
                  items={filteredOwn.map((question) => ({
                    id: question.id,
                    title: question.title,
                    meta: question.importedFrom ? `forked · ${question.topic}` : question.topic,
                    difficulty: question.difficulty,
                  }))}
                  picked={pickedOwn}
                  onToggle={(id) => setPickedOwn((current) => toggle(current, id))}
                />
              )}
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function mcqLabel(bank: QuestionBank, questionId: string): string {
  const question = bank.questions.find((entry) => entry.id === questionId);
  return question ? question.title : questionId;
}

function SearchBar({
  value,
  placeholder,
  onChange,
  action,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="pl-9"
        />
      </label>
      {action}
    </div>
  );
}

interface SelectableItem {
  id: string;
  title: string;
  meta: string;
  difficulty: string;
}

function SelectableList({
  items,
  picked,
  onToggle,
}: {
  items: SelectableItem[];
  picked: string[];
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Nothing matches these filters.</p>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {items.slice(0, 60).map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3 py-2">
            <input
              type="checkbox"
              className="size-4 accent-primary-600"
              checked={picked.includes(item.id)}
              onChange={() => onToggle(item.id)}
              aria-label={`Select ${item.title}`}
            />
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.title}</span>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{item.meta}</span>
            <Badge
              tone={item.difficulty === "EASY" ? "green" : item.difficulty === "HARD" ? "red" : "amber"}
              size="sm"
            >
              {item.difficulty}
            </Badge>
          </li>
        ))}
      </ul>
      {items.length > 60 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the first 60 of {items.length} — narrow the filters or use the random draw.
        </p>
      )}
    </div>
  );
}

export default LibraryPickerModal;