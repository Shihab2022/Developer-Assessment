"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Input";
import {
  attemptsUsed,
  entryForParticipant,
  useCompetitionsStore,
} from "@/store/competitions";
import { isEmail } from "@/lib/utils";
import type { Competition } from "@/lib/competitions/types";

/**
 * Join gate for a competition (requirement 4 — open link, invite code and
 * attempt limits are enforced before the paper is shown).
 */
export function CompetitionJoinCard({ competition }: { competition: Competition }) {
  const router = useRouter();
  const entries = useCompetitionsStore((state) => state.entries);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const join = () => {
    const participantName = name.trim();
    if (participantName.length < 2) {
      setError("Tell us your name so the leaderboard can rank you.");
      return;
    }
    if (email.trim() && !isEmail(email.trim())) {
      setError("That email address does not look valid.");
      return;
    }
    if (competition.rules.access === "CODE") {
      const expected = competition.inviteCode.replace(/[\s-]/g, "").toUpperCase();
      const given = accessCode.replace(/[\s-]/g, "").toUpperCase();
      if (given !== expected) {
        setError("That invite code does not match this competition.");
        return;
      }
    }
    const used = attemptsUsed(entries, competition, {
      participantName,
      participantEmail: email.trim() || undefined,
    });
    if (used >= competition.rules.maxAttempts) {
      setError("You have used all attempts for this competition.");
      return;
    }
    const resuming = entryForParticipant(entries, competition.id, {
      participantName,
      participantEmail: email.trim() || undefined,
    });
    if (resuming && resuming.status === "IN_PROGRESS") {
      toast.info("Resuming your in-progress attempt.");
    }
    setError(null);
    const params = new URLSearchParams({
      name: participantName,
      email: email.trim(),
      org: organisation.trim(),
      code: accessCode.trim(),
    });
    router.push(`/competitions/${competition.id}/attempt?${params.toString()}`);
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Your name"
            required
            placeholder="Ada Lovelace"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="Email (optional)"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Organisation (optional)"
            placeholder="University / company"
            value={organisation}
            onChange={(event) => setOrganisation(event.target.value)}
          />
          {competition.rules.access === "CODE" && (
            <TextField
              label="Invite code"
              required
              placeholder={competition.inviteCode}
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
            />
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button onClick={join}>
            Start attempt
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default CompetitionJoinCard;

