"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardCopy, Mail, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Primitives";
import { useDebouncedValue } from "@/hooks/useUi";
import { useInterviewCandidates, useInviteToInterview } from "@/hooks/useInterviews";
import { cn, copyToClipboard, isEmail } from "@/lib/utils";

interface Props {
  interviewId: string;
}

/**
 * Requirement 2/3: invite a candidate by typing their email **or** pick an
 * existing platform user (someone who already sat another exam). Either way the
 * server emails a personal, secured link that only that mailbox can open.
 */
export function InterviewInviteCard({ interviewId }: Props) {
  const invite = useInviteToInterview(interviewId);

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, { name: string; email: string }>>({});
  const debouncedSearch = useDebouncedValue(search, 350);

  const candidates = useInterviewCandidates(debouncedSearch);
  const candidateRows = candidates.data ?? [];
  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);

  const sendOne = () => {
    if (!isEmail(candidateEmail.trim())) {
      toast.error("Enter a valid email address");
      return;
    }
    invite.mutate(
      {
        candidates: [
          { email: candidateEmail.trim(), name: candidateName.trim() || undefined, sendEmail: true },
        ],
      },
      {
        onSuccess: () => {
          setCandidateName("");
          setCandidateEmail("");
        },
      },
    );
  };

  const sendSelected = () => {
    const picked = Object.values(selected);
    if (!picked.length) return;
    invite.mutate(
      { candidates: picked.map((row) => ({ ...row, sendEmail: true })) },
      { onSuccess: () => setSelected({}) },
    );
  };

  const linkRow = invite.data?.results?.[0]?.link;

  return (
    <Card>
      <CardHeader
        icon={<Mail className="size-4" />}
        title="Invite candidates"
        subtitle="We email a personal, secured exam link — only the invited inbox can open it"
        action={
          <Button size="sm" variant="outline" asChild>
            <Link href={`/recruiter/interviews/${interviewId}/invite`}>
              <UserPlus className="size-4" />
              Open invite page
            </Link>
          </Button>
        }
      />
      <CardBody className="space-y-5">
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Invite by email</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="invite-name">Candidate name (optional)</Label>
              <Input
                id="invite-name"
                placeholder="Jane Candidate"
                value={candidateName}
                onChange={(event) => setCandidateName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="invite-email">Candidate email *</Label>
              <Input
                id="invite-email"
                placeholder="abc@gmail.com"
                type="email"
                value={candidateEmail}
                onChange={(event) => setCandidateEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendOne();
                }}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              onClick={sendOne}
              loading={invite.isPending}
              disabled={!isEmail(candidateEmail.trim())}
            >
              <Mail className="size-4" />
              Send invitation
            </Button>
            {linkRow && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void copyToClipboard(linkRow).then((ok) =>
                    toast[ok ? "success" : "error"](ok ? "Link copied" : "Could not copy"),
                  );
                }}
              >
                <ClipboardCopy className="size-4" />
                Copy last link
              </Button>
            )}
          </div>
        </div>

        {/* --------------------------------- existing users (other exams) */}
        <div className="rounded-lg border border-border p-4">
          <p className="mb-1 text-sm font-medium text-foreground">Add existing users</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Search people who already have an account here (for example candidates who sat another
            exam) and invite them in one go.
          </p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search existing candidates"
              placeholder="Search by name or email…"
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="thin-scrollbar mt-3 max-h-64 space-y-1 overflow-y-auto">
            {candidates.isPending && <Spinner className="mx-auto my-6" size={22} />}

            {!candidates.isPending && candidateRows.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {debouncedSearch ? "No matching users found." : "Type to search existing users."}
              </p>
            )}

            {!candidates.isPending &&
              candidateRows.map((row) => {
                const checked = Boolean(selected[row.email]);
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() =>
                      setSelected((prev) => {
                        const next = { ...prev };
                        if (next[row.email]) delete next[row.email];
                        else next[row.email] = { name: row.name, email: row.email };
                        return next;
                      })
                    }
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition",
                      checked
                        ? "border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-950/40"
                        : "border-transparent hover:bg-muted/50",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{row.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.email}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {row.examsTaken} exam{row.examsTaken === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
          </div>

          <Button
            className="mt-3"
            size="sm"
            onClick={sendSelected}
            loading={invite.isPending}
            disabled={selectedCount === 0}
          >
            <Mail className="size-4" />
            Invite {selectedCount || ""} selected
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

