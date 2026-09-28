"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download, Pencil, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Primitives";
import { LeaderboardTable } from "@/components/competitions/LeaderboardTable";
import { CompetitionDetailCards } from "@/components/competitions/CompetitionDetailCards";
import {
  accessCodeMatches,
  competitionById,
  entriesFor,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";
import { leaderboardCsv } from "@/lib/competitions/scoring";
import { copyToClipboard, downloadBlob, formatDateTime } from "@/lib/utils";

export default function RecruiterCompetitionPage() {
  const params = useParams();
  const hydrated = useCompetitionsHydrated();
  const competitions = hydrated
    ? useCompetitionsStore((state) => state.competitions)
    : [];
  const entries = hydrated
    ? useCompetitionsStore((state) => state.entries)
    : [];
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  const competition = useMemo(
    () =>
      params.id
        ? competitionById(competitions, params.id as string)
        : undefined,
    [competitions, params.id],
  );
  const competitionEntries = useMemo(
    () => competition ? entriesFor(entries, resolvedCompetition.id) : [],
    [competition, entries],
  );

  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  if (!competition) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-muted-foreground">Competition not found.</p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/recruiter/competitions">
            <ArrowLeft className="size-4" />
            Back to competitions
          </Link>
        </Button>
      </div>
    );
  }

  if (!competition) {
    return null;
  }
  const resolvedCompetition = competition as Competition;

  const isOpen =
    resolvedCompetition.status === "OPEN" &&
    (!resolvedCompetition.rules.opensAt ||
      new Date(resolvedCompetition.rules.opensAt).getTime() <= Date.now()) &&
    (!resolvedCompetition.rules.closesAt ||
      new Date(resolvedCompetition.rules.closesAt).getTime() >= Date.now());

  function handleCopy() {
    const code = inviteCode.trim() || resolvedCompetition.inviteCode;
    copyToClipboard(code).then(() => {
      setInviteCode(code);
      setCopied(true);
      toast.success("Invite code copied.");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownloadCsv() {
    const csv = leaderboardCsv(competitionEntries, resolvedCompetition);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `competition-${resolvedCompetition.id}-leaderboard.csv`);
    toast.success("Leaderboard exported.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        asChild
      >
        <Link href="/recruiter/competitions">
          <ArrowLeft className="size-4" />
          Back to competitions
        </Link>
      </Button>

      <PageHeader
        title={competition.title}
        subtitle={competition.organiser}
      />

      <Card className="mt-6">
        <CardBody className="space-y-6">
          <CompetitionDetailCards
        competition={competition}
        entriesCount={competitionEntries.length}
        onPublish={() => {
          useCompetitionsStore.getState().publishCompetition(resolvedCompetition.id);
          toast.success("Competition reopened.");
        }}
        onClose={() => {
          useCompetitionsStore.getState().closeCompetition(resolvedCompetition.id);
          toast.success("Competition closed.");
        }}
      />

          <div className="border-t border-border pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Invite code
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share this code with candidates who join by code.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  className="w-36 font-mono text-sm"
                  placeholder={resolvedCompetition.inviteCode}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? (
                    <span className="text-sm">Copied</span>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>


        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              Leaderboard · {competitionEntries.length} {competitionEntries.length === 1 ? "" : "s"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCsv}
              disabled={competitionEntries.length === 0}
            >
              <Download className="size-4" />
              Download CSV
            </Button>
          </div>

          {competitionEntries.length > 0 ? (
            <LeaderboardTable
              entries={competitionEntries}
              competition={competition}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No entries yet.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
