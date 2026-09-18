"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Pencil, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import type { Competition } from "@/lib/competitions/types";
import { isJoinable } from "@/lib/competitions/paper";
import { copyToClipboard, formatDateTime } from "@/lib/utils";

/**
 * Host console header cards (requirement 4 — publish, share and close the
 * competition from one dashboard).
 */
export function CompetitionDetailCards({
  competition,
  entriesCount,
  onPublish,
  onClose,
}: {
  competition: Competition;
  entriesCount: number;
  onPublish: () => void;
  onClose: () => void;
}) {
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/competitions/${competition.id}` : "";
  const joinable = isJoinable(competition);

  const copy = async (text: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(`${label} copied`);
    else toast.error("Could not copy — your browser blocked the clipboard");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge tone={competition.status === "OPEN" ? "green" : competition.status === "CLOSED" ? "amber" : "gray"}>
              {competition.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {entriesCount} {entriesCount === 1 ? "entry" : "entries"} · updated{" "}
              {formatDateTime(competition.updatedAt)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/recruiter/competitions/${competition.id}/edit`}>
                <Pencil className="size-4" />
                Edit paper
              </Link>
            </Button>
            {competition.status === "DRAFT" && (
              <Button size="sm" onClick={onPublish}>
                <Send className="size-4" />
                Publish
              </Button>
            )}
            {competition.status === "OPEN" && (
              <Button size="sm" variant="outline" onClick={onClose}>
                Close entries
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild>
              <Link href="/recruiter/competitions">
                <ArrowLeft className="size-4" />
                All competitions
              </Link>
            </Button>
          </div>
          {!joinable && competition.status === "OPEN" && (
            <p className="text-xs text-muted-foreground">
              The open window has passed, so the public join page is closed. Extend the
              window or close the competition to freeze the leaderboard.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="space-y-1.5">
            <Label>Invite code</Label>
            <div className="flex items-center gap-2">
              <code className="rounded-md bg-muted/40 px-3 py-1.5 font-mono text-base font-semibold tracking-wider">
                {competition.inviteCode}
              </code>
              <Button size="sm" variant="outline" onClick={() => copy(competition.inviteCode, "Invite code")}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Share link</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="font-mono text-xs" onFocus={(event) => event.target.select()} />
              <Button size="sm" variant="outline" onClick={() => copy(shareUrl, "Share link")}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default CompetitionDetailCards;

