"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { useCompetitionsHydrated, useCompetitionsStore } from "@/store/competitions";
import { isJoinable } from "@/lib/competitions/paper";
import { formatDateTime, pluralize } from "@/lib/utils";
import { competitionCardTone } from "@/lib/competitions/landing-ui";

/**
 * Public competition browser (requirement 4 — companies/institutes host,
 * anyone can discover and join open contests).
 *
 * Client-side because the competitions store lives in localStorage; shows a
 * spinner until hydration so the server markup matches the first paint.
 */
export function CompetitionsBrowser() {
  const hydrated = useCompetitionsHydrated();
  const competitions = useCompetitionsStore((state) => state.competitions);

  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  const open = competitions.filter((competition) => isJoinable(competition));
  const upcoming = competitions.filter(
    (competition) => competition.status === "DRAFT" || !isJoinable(competition),
  );

  if (competitions.length === 0) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <Users className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">No competitions yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Be the first to host one — build a paper from the shared banks or your own
            questions and publish an invite link in minutes.
          </p>
          <Button size="sm" asChild className="mt-4">
            <Link href="/register">Host a competition</Link>
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {open.length > 0 && (
        <section aria-label="Open competitions">
          <div className="grid gap-4 sm:grid-cols-2">
            {open.map((competition) => (
              <Card key={competition.id}>
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{competition.title}</h3>
                    <Badge tone={competitionCardTone(competition.status)} size="sm">
                      OPEN
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {competition.organiser} · {competition.items.length}{" "}
                    {pluralize(competition.items.length, "question")} ·{" "}
                    {competition.rules.durationMinutes} min · closes{" "}
                    {competition.rules.closesAt
                      ? formatDateTime(competition.rules.closesAt)
                      : "when the host closes it"}
                  </p>
                  {competition.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {competition.description}
                    </p>
                  )}
                  <div className="mt-auto flex justify-end">
                    <Button size="sm" asChild>
                      <Link href={`/competitions/${competition.id}`}>View & join</Link>
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section aria-label="More competitions">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {open.length > 0 ? "Also on the board" : "All competitions"}
          </h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-border">
                {upcoming.map((competition) => (
                  <tr key={competition.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/competitions/${competition.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {competition.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {competition.organiser} · {competition.items.length}{" "}
                        {pluralize(competition.items.length, "question")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={competitionCardTone(competition.status)} size="sm">
                        {competition.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default CompetitionsBrowser;

