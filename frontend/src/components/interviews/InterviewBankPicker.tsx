"use client";

import { useMemo, useState } from "react";
import { LibraryBig, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Primitives";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/Modal";
import { DifficultyBadge } from "@/components/ui/Badge";
import { useAddBankQuestions, useInterviewBank } from "@/hooks/useInterviews";
import { cn } from "@/lib/utils";

interface Props {
  interviewId: string;
  technology: string;
  /** Bank keys already present so they cannot be added twice. */
  existingKeys: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Requirement 6: the interview is seeded with a random set of bank questions —
 * this picker lets a recruiter/admin cherry-pick extra ones from the bank.
 */
export function InterviewBankPicker({
  interviewId,
  technology,
  existingKeys,
  open,
  onOpenChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const bank = useInterviewBank(technology, "", open);
  const add = useAddBankQuestions(interviewId);

  const already = useMemo(() => new Set(existingKeys), [existingKeys]);
  const rows = (bank.data?.questions ?? []).filter(
    (question) => !search.trim() || question.prompt.toLowerCase().includes(search.toLowerCase()) || question.topic.toLowerCase().includes(search.toLowerCase()),
  );
  const selectedKeys = Object.keys(selected).filter((key) => selected[key]);

  const submit = () => {
    if (!selectedKeys.length) return;
    add.mutate(selectedKeys, {
      onSuccess: () => {
        setSelected({});
        onOpenChange(false);
      },
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <LibraryBig className="size-4" />
            Add from the question bank
          </ModalTitle>
          <p className="text-sm text-muted-foreground">
            {bank.data
              ? `${bank.data.label} · ${bank.data.total} questions in the bank.`
              : "Loading the built-in bank…"}
          </p>
        </ModalHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search the question bank"
              placeholder="Search by topic or keyword…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="thin-scrollbar max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {bank.isPending && <Spinner className="mx-auto my-8" size={24} />}

            {!bank.isPending && rows.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No bank questions match your search.
              </p>
            )}

            {!bank.isPending &&
              rows.map((question) => {
                const inBank = already.has(question.key);
                const checked = Boolean(selected[question.key]);
                return (
                  <button
                    key={question.key}
                    type="button"
                    disabled={inBank}
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [question.key]: !prev[question.key] }))
                    }
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition",
                      inBank
                        ? "cursor-not-allowed border-border bg-muted/40 opacity-60"
                        : checked
                          ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-950/40"
                          : "border-border hover:bg-muted/50",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {question.topic}
                        </span>
                        <DifficultyBadge difficulty={question.difficulty} />
                      </span>
                      <span className="block text-sm text-foreground">{question.prompt}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {inBank ? "Added" : checked ? "Selected" : ""}
                    </span>
                  </button>
                );
              })}
          </div>

          <Label className="text-xs text-muted-foreground">
            {selectedKeys.length} question(s) selected
          </Label>
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={add.isPending} disabled={!selectedKeys.length}>
            <LibraryBig className="size-4" />
            Add {selectedKeys.length || ""} to this interview
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
