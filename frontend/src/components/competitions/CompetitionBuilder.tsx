"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, Layers, Plus, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label, TextField, TextareaField } from "@/components/ui/Input";
import { RadioCardGroup, type RadioOption } from "@/components/ui/RadioGroup";
import { SelectField } from "@/components/ui/Select";
import { CheckboxField } from "@/components/ui/Checkbox";
import {
  LIBRARY_PROBLEMS,
  LIBRARY_TECHNOLOGIES,
  libraryTechnologyRow,
} from "@/lib/competitions/library";
import { createInviteCode } from "@/lib/competitions/paper";
import type {
  Competition,
  CompetitionAccess,
  CompetitionRules,
  OwnQuestion,
  PaperItem,
  PaperSource,
} from "@/lib/competitions/types";
import type { QuestionBank } from "@/lib/question-banks/types";
import { loadBank } from "@/lib/question-banks/load";
import { LibraryPickerModal, type NewPaperItem } from "@/components/competitions/LibraryPicker";
import { QuestionEditorModal } from "@/components/competitions/QuestionEditor";
import { useCompetitionsStore } from "@/store/competitions";
import { cn } from "@/lib/utils";

/**
 * Competition builder (requirement 4).
 *
 * Three steps — basics, paper, publish — shared by the "new competition" page
 * and the per-competition editor. The paper step mixes all three question
 * sources via `<LibraryPickerModal>`; publishing mints the invite code and
 * opens the competition for joining.
 */

const DEFAULT_POINTS: Record<PaperSource, number> = {
  "library-mcq": 1,
  "library-coding": 10,
  own: 5,
};

const ACCESS_OPTIONS: RadioOption[] = [
  {
    value: "LINK",
    label: "Anyone with the link",
    description: "Participants join from the public competitions page — good for open contests.",
  },
  {
    value: "CODE",
    label: "Invite code required",
    description: "The link works, but joining also needs the code — good for institute rounds.",
  },
];

const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180].map((minutes) => ({
  value: String(minutes),
  label: `${minutes} minutes`,
}));

const DEFAULT_RULES: CompetitionRules = {
  durationMinutes: 60,
  access: "LINK",
  maxAttempts: 1,
  passPercent: 60,
  shuffleQuestions: true,
  shuffleOptions: true,
  showLeaderboard: true,
  showExplanations: true,
  antiCheat: true,
};

function createItemId(): string {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) return `row-${cryptoRef.randomUUID().slice(0, 8)}`;
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function CompetitionBuilder({ competition }: { competition?: Competition }) {
  const router = useRouter();
  const createCompetition = useCompetitionsStore((state) => state.createCompetition);
  const updateCompetition = useCompetitionsStore((state) => state.updateCompetition);
  const publishCompetition = useCompetitionsStore((state) => state.publishCompetition);
  const ownQuestions = useCompetitionsStore((state) => state.ownQuestions);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(competition?.title ?? "");
  const [organiser, setOrganiser] = useState(competition?.organiser ?? "");
  const [description, setDescription] = useState(competition?.description ?? "");
  const [tags, setTags] = useState((competition?.tags ?? []).join(", "));
  const [rules, setRules] = useState<CompetitionRules>(competition?.rules ?? DEFAULT_RULES);
  const [items, setItems] = useState<PaperItem[]>(competition?.items ?? []);
  const [bankCache, setBankCache] = useState<Record<string, QuestionBank>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [questionEditorOpen, setQuestionEditorOpen] = useState(false);
  const [editingOwnQuestion, setEditingOwnQuestion] = useState<OwnQuestion | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  /* Load the banks the paper references so row titles can be shown. */
  useEffect(() => {
    const technologies = Array.from(
      new Set(items.filter((item) => item.source === "library-mcq").map((item) => item.technology)),
        ).filter((technology): technology is string => technology !== undefined && !(technology in bankCache));

    if (technologies.length === 0) return;
    let cancelled = false;

    void (async () => {
      for (const technology of technologies) {
        try {
          const loaded = await loadBank(technology);
          if (cancelled) return;
          setBankCache((current) => ({ ...current, [technology]: loaded }));
        } catch {
          if (!cancelled) setBankCache((current) => ({ ...current, [technology]: undefined as unknown as QuestionBank }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, bankCache]);

  const rowTitle = useCallback(
    (item: PaperItem): string => {
      if (item.source === "own") {
        return ownQuestions.find((question) => question.id === item.ownId)?.title ?? "Deleted question";
      }
      if (item.source === "library-coding") {
        return (
          LIBRARY_PROBLEMS.find((problem) => problem.id === item.problemId)?.title ??
          "Missing problem"
        );
      }
      const bank = item.technology ? bankCache[item.technology] : undefined;
      const question = bank?.questions.find((entry) => entry.id === item.questionId);
      return question?.title ?? `${item.technology ?? "?"} · ${item.questionId ?? "?"}`;
    },
    [ownQuestions, bankCache],
  );

  const totalPoints = useMemo(
    () => items.reduce((sum, item) => sum + item.points, 0),
    [items],
  );

  /* ------------------------------------------------------------- actions */

  const addItems = useCallback((incoming: { source: PaperSource; technology?: string; questionId?: string; problemId?: string; ownId?: string; label: string }[]) => {
    setItems((current) => [
      ...current,
      ...incoming.map((entry) => ({
        id: createItemId(),
        source: entry.source,
        technology: entry.technology,
        questionId: entry.questionId,
        problemId: entry.problemId,
        ownId: entry.ownId,
        points: DEFAULT_POINTS[entry.source],
      })),
    ]);
  }, []);

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const temp = next[index]!;
      next[index] = next[target]!;
      next[target] = temp;
      return next;
    });
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Give the competition a title.";
    if (!organiser.trim()) return "Who is hosting it? Add the company / institute name.";
    if (items.length === 0) return "Add at least one question to the paper.";
    if (items.some((item) => item.points <= 0)) return "Every row needs at least one point.";
    return null;
  };

  const persistDraft = useCallback((): Competition | null => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return null;
    }

    const payload = {
      title: title.trim(),
      organiser: organiser.trim(),
      description: description.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      rules,
      items,
      seed: competition?.seed ?? Math.floor(Math.random() * 0xffffffff),
    };

    if (competition) {
      updateCompetition(competition.id, payload);
      return { ...competition, ...payload, updatedAt: new Date().toISOString() };
    }

    return createCompetition(payload);
    // `validate` reads the current state, so the callback stays inline on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, organiser, description, tags, rules, items, competition, createCompetition, updateCompetition]);

  const handleSaveDraft = () => {
    setSaving(true);
    try {
      const saved = persistDraft();
      if (!saved) return;
      if (!competition) {
        toast.success("Competition saved as a draft");
        router.push(`/recruiter/competitions/${saved.id}`);
        return;
      }
      toast.success("Draft updated");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = () => {
    const saved = persistDraft();
    if (!saved) return;
    publishCompetition(saved.id);
    toast.success("Competition is live — share the invite link!");
    if (!competition) {
      router.push(`/recruiter/competitions/${saved.id}`);
    } else {
      setStep(2);
    }
  };

  const regenerateCode = () => {
    if (!competition) return;
    updateCompetition(competition.id, { inviteCode: createInviteCode() });
    toast.info("New code generated");
  };

  const shareUrl =
    competition && typeof window !== "undefined"
      ? `${window.location.origin}/competitions/${competition.id}`
      : "";

  const steps = ["Basics", "Paper", "Publish"];

  const canAdvance = (): string | null => {
    if (!title.trim()) return "Give the competition a title.";
    if (!organiser.trim()) return "Name the company or institute running this competition.";
    if (step >= 1 && items.length === 0) return "Add at least one question to the paper.";
    if (items.some((item) => item.points <= 0)) return "Every question needs at least one point.";
    return null;
  };

  const handleQuestionSaved = (question: OwnQuestion) => {
    if (!editingOwnQuestion) {
      addItems([{ source: "own", ownId: question.id, label: question.title }]);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy — your browser blocked the clipboard");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {competition ? "Edit competition" : "New competition"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {competition
            ? "Update the paper, rules and publishing settings."
            : "Assemble a paper from our question banks or your own questions."}
        </p>
      </div>

      <div className="flex items-center gap-3 border-b border-border">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={cn(
              "pb-2 text-sm font-medium transition-colors",
              step === index
                ? "border-b-2 border-primary-600 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <BasicsStep
          title={title}
          setTitle={setTitle}
          organiser={organiser}
          setOrganiser={setOrganiser}
          description={description}
          setDescription={setDescription}
          tags={tags}
          setTags={setTags}
          rules={rules}
          setRules={setRules}
        />
      )}

      {step === 1 && (
        <PaperStep
          items={items}
          setItems={setItems}
          totalPoints={totalPoints}
          rowTitle={rowTitle}
          moveItem={moveItem}
          setPickerOpen={setPickerOpen}
          setQuestionEditorOpen={setQuestionEditorOpen}
          setEditingOwnQuestion={setEditingOwnQuestion}
        />
      )}

      {step === 2 && (
        <PublishStep
          competition={competition}
          rules={rules}
          shareUrl={shareUrl}
          copyShareUrl={copyShareUrl}
          regenerateCode={regenerateCode}
        />
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={() => {
                const problem = canAdvance();
                if (problem) {
                  toast.error(problem);
                  return;
                }
                setStep(step + 1);
              }}
            >
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handlePublish}>
              <Send className="size-4" />
              Publish competition
            </Button>
          )}
        </div>
      </div>

      <LibraryPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onAdd={addItems}
        ownQuestions={ownQuestions}
      />
      <QuestionEditorModal
        open={questionEditorOpen}
        onOpenChange={setQuestionEditorOpen}
                question={editingOwnQuestion}
        onSaved={handleQuestionSaved}
      />
    </div>
  );
}

/* ----------------------------------------------------------- step views */

const MAX_ATTEMPTS_OPTIONS = [1, 2, 3, 5].map((n) => ({
  value: String(n),
  label: `${n} ${n === 1 ? "attempt" : "attempts"}`,
}));

function BasicsStep({
  title,
  setTitle,
  organiser,
  setOrganiser,
  description,
  setDescription,
  tags,
  setTags,
  rules,
  setRules,
}: {
  title: string;
  setTitle: (value: string) => void;
  organiser: string;
  setOrganiser: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
  rules: CompetitionRules;
  setRules: (rules: CompetitionRules) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Competition title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Spring Coding Challenge 2026"
        />
        <TextField
          label="Organising company / institute"
          required
          value={organiser}
          onChange={(e) => setOrganiser(e.target.value)}
          placeholder="e.g. Acme Corp"
        />
      </div>

      <TextareaField
        label="Description"
        placeholder="What is this competition about? Shown on the public page."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />

      <TextField
        label="Tags"
        hint="Comma-separated, e.g. javascript, arrays, interview"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-foreground">Rules </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Duration"
            value={String(rules.durationMinutes)}
            onValueChange={(value) => setRules({ ...rules, durationMinutes: Number(value) })}
            options={DURATION_OPTIONS}
          />
          <SelectField
            label="Max attempts"
            value={String(rules.maxAttempts)}
            onValueChange={(value) => setRules({ ...rules, maxAttempts: Number(value) })}
            options={MAX_ATTEMPTS_OPTIONS}
          />
        </div>

        <TextField
          label="Pass percentage"
          type="number"
          min={0}
          max={100}
          value={String(rules.passPercent)}
          onChange={(e) => setRules({ ...rules, passPercent: Number(e.target.value) || 0 })}
        />

        <RadioCardGroup
          label="Who can join?"
          value={rules.access}
          onValueChange={(value) => setRules({ ...rules, access: value as CompetitionAccess })}
          options={ACCESS_OPTIONS}
        />

        <div className="space-y-2">
          <CheckboxField
            label="Shuffle question order"
            description="Each participant gets the same questions in a seeded, random order."
            checked={rules.shuffleQuestions}
            onCheckedChange={(checked) => setRules({ ...rules, shuffleQuestions: checked })}
          />
          <CheckboxField
            label="Shuffle answer options"
            description="MCQ options are reordered per participant."
            checked={rules.shuffleOptions}
            onCheckedChange={(checked) => setRules({ ...rules, shuffleOptions: checked })}
          />
          <CheckboxField
            label="Show leaderboard"
            description="Reveal the ranking to participants after the competition ends."
            checked={rules.showLeaderboard}
            onCheckedChange={(checked) => setRules({ ...rules, showLeaderboard: checked })}
          />
          <CheckboxField
            label="Show explanations on results"
            description="Reveal the correct answer and explanation after submission."
            checked={rules.showExplanations}
            onCheckedChange={(checked) => setRules({ ...rules, showExplanations: checked })}
          />
          <CheckboxField
            label="Anti-cheat monitoring"
            description="Record tab-switch and copy events during the attempt."
            checked={rules.antiCheat}
            onCheckedChange={(checked) => setRules({ ...rules, antiCheat: checked })}
          />
        </div>
      </fieldset>
    </div>
  );
}


function PaperStep({
  items,
  setItems,
  totalPoints,
  rowTitle,
  moveItem,
  setPickerOpen,
  setQuestionEditorOpen,
  setEditingOwnQuestion,
}: {
  items: PaperItem[];
  setItems: Dispatch<SetStateAction<PaperItem[]>>;
  totalPoints: number;
  rowTitle: (item: PaperItem) => string;
  moveItem: (index: number, direction: -1 | 1) => void;
  setPickerOpen: (open: boolean) => void;
  setQuestionEditorOpen: (open: boolean) => void;
  setEditingOwnQuestion: (question: OwnQuestion | undefined) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-medium text-foreground">
            Questions on the paper ({items.length})
          </span>
          {items.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {" "}
              · {totalPoints} {totalPoints === 1 ? "point" : "points"} total
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingOwnQuestion(undefined);
              setQuestionEditorOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add own question
          </Button>
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <Layers className="size-4" />
            Add from library
          </Button>
        </div>
            </div>

      {items.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center">
            <Layers className="mx-auto size-10 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No questions on the paper yet. Add questions from our MCQ banks,
              coding problem library, or write your own.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="w-20 px-3 py-2 font-medium">Points</th>
                <th className="w-28 px-3 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-3 py-2.5 text-center align-middle text-xs text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Badge
                      tone={
                        item.source === "library-coding"
                          ? "blue"
                          : item.source === "own"
                            ? "violet"
                            : "amber"
                      }
                      size="sm"
                    >
                      {item.source === "library-mcq"
                        ? "MCQ"
                        : item.source === "library-coding"
                          ? "Coding"
                          : "Own"}
                    </Badge>
                    {item.technology && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ·{" "}
                        {libraryTechnologyRow(item.technology)?.label ?? item.technology}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <span className="block max-w-[400px] truncate text-foreground">
                      {rowTitle(item)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <Input
                      type="number"
                      min={1}
                      value={item.points}
                      onChange={(e) =>
                        setItems((current) =>
                          current.map((existing) =>
                            existing.id === item.id
                              ? { ...existing, points: Math.max(1, Number(e.target.value) || 1) }
                              : existing,
                          ),
                        )
                      }
                      className="h-8 w-20 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="iconSm"
                        variant="ghost"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        size="iconSm"
                        variant="ghost"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === items.length - 1}
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        size="iconSm"
                        variant="ghost"
                        onClick={() =>
                          setItems((current) =>
                            current.filter((existing) => existing.id !== item.id),
                          )
                        }
                        aria-label="Remove"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            )}
    </div>
  );
}

function PublishStep({
  competition,
  rules,
  shareUrl,
  copyShareUrl,
  regenerateCode,
}: {
  competition?: Competition;
  rules: CompetitionRules;
  shareUrl: string;
  copyShareUrl: () => void;
  regenerateCode: () => void;
}) {
  const statusTone =
    competition?.status === "OPEN"
      ? "green"
      : competition?.status === "CLOSED"
        ? "amber"
        : "gray";
  const statusLabel =
    competition?.status === "OPEN"
      ? "Live"
      : competition?.status === "CLOSED"
        ? "Closed"
        : "Draft";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-foreground">Status</span>
          <p className="text-xs text-muted-foreground">
            {competition?.status === "OPEN"
              ? "Your competition is live and accepting entries."
              : "Publish to open the competition to participants."}
          </p>
        </div>
        {competition && <Badge tone={statusTone}>{statusLabel}</Badge>}
      </div>

      {competition && (
        <>
          <div className="space-y-2">
            <Label>Invite code</Label>
            <div className="flex items-center gap-2">
              <code className="rounded-md bg-muted/40 px-3 py-1.5 font-mono text-lg font-semibold tracking-wider">
                {competition.inviteCode}
              </code>
              <Button size="sm" variant="outline" onClick={regenerateCode}>
                Regenerate
              </Button>
            </div>
            {rules.access === "CODE" && (
              <p className="text-xs text-muted-foreground">
                Participants need this code to join.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Share link</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl}
                className="font-mono text-sm"
                onFocus={(e) => e.target.select()}
              />
              <Button size="sm" variant="outline" onClick={copyShareUrl}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {!competition && (
        <p className="text-sm text-muted-foreground">
          Publishing saves the competition, opens it for participants and
          generates a shareable invite link. You'll be redirected to the
          competition dashboard.
        </p>
      )}
    </div>
  );
}


export default CompetitionBuilder;
