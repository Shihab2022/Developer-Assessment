"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, ExternalLink, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Primitives";
import { COMPETITION_STATUSES } from "@/lib/constants";
import { formatDateTime, pluralize } from "@/lib/utils";
import {
  entriesFor,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";
import type { Competition, CompetitionStatus } from "@/lib/competitions/types";

const ACCESS_LABELS: Record<Competition["rules"]["access"], string> = {
  LINK: "Open link",
  CODE: "Invite code",
  INVITE: "Private",
};

function statusTone(status: CompetitionStatus): "gray" | "green" | "amber" {
  if (status === "OPEN") return "green";
  if (status === "CLOSED") return "amber";
  return "gray";
}

export default function RecruiterCompetitionsPage() {
  return (
    <Suspense fallback={null}>
      <CompetitionsContent />
    </Suspense>
  );
}

function CompetitionsContent() {
  const router = useRouter();
  const hydrated = useCompetitionsHydrated();
  const competitions = useCompetitionsStore((state) => state.competitions);
  const entries = useCompetitionsStore((state) => state.entries);
  const duplicateCompetition = useCompetitionsStore((state) => state.duplicateCompetition);
  const removeCompetition = useCompetitionsStore((state) => state.removeCompetition);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...competitions]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((competition) => {
        if (status && competition.status !== status) return false;
        if (!needle) return true;
        return [competition.title, competition.organiser, competition.inviteCode]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
  }, [competitions, query, status]);



  const duplicate = (id: string) => {
    const copy = duplicateCompetition(id);
    if (copy) {
      toast.success("Competition duplicated as a draft");
      router.push(`/recruiter/competitions/${copy.id}/edit`);
    }
  };

  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  return (
    <>
      <PageHeader
        title="Competitions"
        subtitle="Host time-boxed contests from our question banks, your own questions, or both"
        actions={
          <>
            <Button size="sm" variant="outline" asChild>
              <Link href="/recruiter/competitions/questions">My questions</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/recruiter/competitions/new">
                <Plus className="size-4" />
                New competition
              </Link>
            </Button>
          </>
        }
      />
      <CompetitionTable
        competitions={filtered}
        total={competitions.length}
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
        entriesCount={(id) => entriesFor(entries, id).length}
        onDuplicate={duplicate}
        onDelete={(competition) => {
          if (
            confirm(
              `Delete "${competition.title}" and all of its entries? This cannot be undone.`,
            )
          ) {
            removeCompetition(competition.id);
            toast.success("Competition deleted");
          }
        }}
      />
    </>
  );

function CompetitionTable({
  competitions,
  total,
  query,
  setQuery,
  status,
  setStatus,
  entriesCount,
  onDuplicate,
  onDelete,
}: {
  competitions: Competition[];
  total: number;
  query: string;
  setQuery: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  entriesCount: (id: string) => number;
  onDuplicate: (id: string) => void;
  onDelete: (competition: Competition) => void;
}) {
  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search title, organiser or invite code…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-w-xs"
          />
          <SelectField
            placeholder="All statuses"
            value={status}
            onValueChange={setStatus}
            options={[{ value: "", label: "All statuses" }].concat(
              COMPETITION_STATUSES.map((value) => ({ value, label: value })),
            )}
            className="w-40"
          />
        </div>
        {competitions.length === 0 ? (
          <EmptyState empty={total === 0} />
        ) : (
          <div className="thin-scrollbar max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Competition</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Invite</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Entries</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {competitions.map((competition) => (
                  <tr key={competition.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/recruiter/competitions/${competition.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {competition.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {competition.organiser} · {competition.items.length}{" "}
                        {pluralize(competition.items.length, "question")} · updated{" "}
                        {formatDateTime(competition.updatedAt)}
                      </p>
                    </td>
                    <td className="py-3">
                      <Badge tone={statusTone(competition.status)} size="sm">
                        {competition.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-xs text-foreground">
                        {competition.inviteCode}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ACCESS_LABELS[competition.rules.access]}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{entriesCount(competition.id)}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild title="Open dashboard">
                          <Link href={`/recruiter/competitions/${competition.id}`}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Edit paper and rules">
                          <Link href={`/recruiter/competitions/${competition.id}/edit`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Duplicate as draft"
                          onClick={() => onDuplicate(competition.id)}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete competition"
                          onClick={() => onDelete(competition)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}


function EmptyState({ empty }: { empty: boolean }) {
  return (
    <div className="py-10 text-center">
      <Trophy className="mx-auto size-10 text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium text-foreground">
        {empty ? "No competitions yet" : "Nothing matches those filters"}
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Build a paper from the shared MCQ and coding banks, add your own questions,
        then publish an invite link or code for participants.
      </p>
      {empty && (
        <Button size="sm" asChild className="mt-4">
          <Link href="/recruiter/competitions/new">
            <Plus className="size-4" />
            Create your first competition
          </Link>
        </Button>
      )}
    </div>
  );
}

}
