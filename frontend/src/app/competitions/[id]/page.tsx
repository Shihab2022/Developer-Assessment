"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, ListOrdered, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { LeaderboardTable } from "@/components/competitions/LeaderboardTable";
import { CompetitionJoinCard } from "@/components/competitions/CompetitionJoinCard";
import { CompetitionMetaCards } from "@/components/competitions/CompetitionMetaCards";
import {
  competitionById,
  entriesFor,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";
import { isJoinable } from "@/lib/competitions/paper";
import { formatDateTime, pluralize } from "@/lib/utils";


export default function CompetitionDetailPage() {
  const params = useParams();
  const hydrated = useCompetitionsHydrated();
  const competitions = hydrated
    ? useCompetitionsStore((state) => state.competitions)
    : [];
  const competition = useMemo(
    () =>
      params.id
        ? competitionById(competitions, params.id as string)
        : undefined,
    [competitions, params.id],
  );
  const entries = useMemo(
    () => competition ? entriesFor(useCompetitionsStore.getState().entries, competition.id) : [],
    [competition],
  );

  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  if (!competition) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-sm text-muted-foreground">Competition not found.</p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/competitions">
            <ArrowLeft className="size-4" />
            Back to competitions
          </Link>
        </Button>
      </div>
    );
  }

  const joinable = isJoinable(competition);
  const leaderboardVisible =
    joinable || competition.rules.showLeaderboard
      ? entries.filter((entry) => entry.status === "SUBMITTED")
      : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
        asChild
      >
        <Link href="/competitions">
          <ArrowLeft className="size-4" />
          Back to competitions
        </Link>
      </Button>

      <CompetitionMetaCards competition={competition} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                About this competition
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {competition.description}
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {competition.tags.length > 0 && (
                  <>
                    <Badge size="sm">{competition.tags.length} topic{competition.tags.length === 1 ? "" : "s"}</Badge>
                    {competition.tags.slice(0, 6).map((tag) => (
                      <Badge key={tag} tone="gray" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          {competition.rules.showLeaderboard && (
            <Card>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Trophy className="size-4" />
                  <span>Leaderboard</span>
                </div>
                {leaderboardVisible.length > 0 ? (
                  <LeaderboardTable entries={leaderboardVisible} competition={competition} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No submissions yet. Be the first to attempt the paper.
                  </p>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <CompetitionJoinCard competition={competition} />
        </div>
      </div>
    </div>
  );
}
