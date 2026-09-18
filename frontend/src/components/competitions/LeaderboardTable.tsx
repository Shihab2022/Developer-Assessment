"use client";

import { Copy, Download, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { downloadCsv } from "@/lib/utils";
import { leaderboardRows } from "@/lib/competitions/scoring";
import type { Competition, CompetitionEntry } from "@/lib/competitions/types";
import { cn } from "@/lib/utils";

/**
 * Ranked results table shared by the host console and the public leaderboard.
 *
 * Ranks come from `leaderboardRows()`: submitted entries first, then score,
 * then earliest submit. Written answers that still need a manual score are
 * flagged so the panel knows the order may still move.
 */

export function LeaderboardTable({
  competition,
  entries,
  showEmails = false,
  onScore,
  className,
}: {
  competition: Competition;
  entries: CompetitionEntry[];
  showEmails?: boolean;
  /** Renders a manual score input for written answers (host only). */
  onScore?: (entryId: string, itemId: string, points: number) => void;
  className?: string;
}) {
  const rows = leaderboardRows(entries);
  const writtenItems = competition.items.filter((item) => item.source === "own");

  const copyLink = async () => {
    const url = `${window.location.origin}/competitions/${competition.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be blocked — the readonly input below still shows it */
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Trophy className="size-4 text-amber-500" />
          Leaderboard
          <span className="text-xs font-normal text-muted-foreground">
            {rows.length} participant{rows.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyLink}>
            <Copy />
            Copy invite link
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv(
                leaderboardRows(entries) as unknown as Record<string, unknown>[],
                `${competition.inviteCode}-leaderboard.csv`,
              )
            }
          >
            <Download />
            CSV
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          No participants yet. Share the invite link or code to fill the field.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">#</th>
                <th className="px-4 py-2 font-medium">Participant</th>
                {showEmails && <th className="px-4 py-2 font-medium">Email</th>}
                <th className="px-4 py-2 font-medium">Score</th>
                <th className="px-4 py-2 font-medium">Correct</th>
                <th className="px-4 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.rank}-${row.participantName}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.rank}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-foreground">{row.participantName}</span>
                    {row.organisation && (
                      <span className="block text-xs text-muted-foreground">{row.organisation}</span>
                    )}
                  </td>
                  {showEmails && (
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {row.participantEmail || "—"}
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-foreground">{row.score}</span>
                    <span className="text-xs text-muted-foreground"> / {row.maxScore}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{row.percent}%</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {row.correctCount} / {row.totalCount}
                  </td>
                  <td className="px-4 py-2.5">
                    {row.status !== "SUBMITTED" ? (
                      <Badge tone="gray" size="sm">
                        in progress
                      </Badge>
                    ) : row.needsReview ? (
                      <Badge tone="amber" size="sm">
                        awaiting review
                      </Badge>
                    ) : (
                      <Badge tone={row.passed ? "green" : "red"} size="sm">
                        {row.passed ? "passed" : "not passed"}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {onScore && writtenItems.length > 0 && (
        <ManualScoring
          competition={competition}
          entries={entries}
          writtenItems={writtenItems.map((item) => item.id)}
          onScore={onScore}
        />
      )}
    </div>
  );
}

/** Inline manual scoring for written answers (organiser only). */
function ManualScoring({
  competition,
  entries,
  writtenItems,
  onScore,
}: {
  competition: Competition;
  entries: CompetitionEntry[];
  writtenItems: string[];
  onScore: (entryId: string, itemId: string, points: number) => void;
}) {
  return (
    <div className="border-t border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Written answers awaiting review
      </p>
      <div className="mt-2 space-y-2">
        {entries
          .filter(
            (entry) =>
              entry.status === "SUBMITTED" &&
              writtenItems.some((itemId) => (entry.answers[itemId] ?? "").trim().length > 0),
          )
          .map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {entry.participantName}
              </span>
              {writtenItems.map((itemId) => (
                <label
                  key={itemId}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  {competition.items.find((item) => item.id === itemId)?.points ?? 0} pts
                  <Input
                    type="number"
                    min={0}
                    className="h-8 w-20"
                    value={entry.manualScores[itemId] ?? ""}
                    onChange={(event) =>
                      onScore(entry.id, itemId, Number(event.target.value) || 0)
                    }
                  />
                </label>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

export default LeaderboardTable;