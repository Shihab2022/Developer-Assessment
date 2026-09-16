"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyInvitations, useAcceptInvitation, useRejectInvitation } from "@/hooks/useCandidate";
import { useStartAttempt } from "@/hooks/useAttempts";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { useRouter } from "next/navigation";

export default function CandidateInvitationsPage() {
  const { data, isLoading } = useMyInvitations({ limit: 50 });
  const accept = useAcceptInvitation();
  const reject = useRejectInvitation();

  const invitations = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="My invitations"
        subtitle="Assessments companies have invited you to take"
      />
      {isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : invitations.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            No invitations yet. When a company invites you, it will appear here.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              onAccept={() => accept.mutate(inv.id)}
              onReject={() => reject.mutate(inv.id)}
              accepting={accept.isPending}
              rejecting={reject.isPending}
            />
          ))}
        </div>
      )}
    </>
  );
}

function InvitationCard({
  invitation,
  onAccept,
  onReject,
  accepting,
  rejecting,
}: {
  invitation: import("@/lib/types").Invitation;
  onAccept: () => void;
  onReject: () => void;
  accepting: boolean;
  rejecting: boolean;
}) {
  const router = useRouter();
  const start = useStartAttempt(invitation.assessment?.id ?? "");
  const [starting, setStarting] = useState(false);

  const canStart =
    invitation.status === "ACCEPTED" &&
    invitation.assessment?.status === "PUBLISHED" &&
    !invitation.attempts?.some((a) => a.status === "IN_PROGRESS" || a.status === "SUBMITTED");

  const inProgress = invitation.attempts?.find((a) => a.status === "IN_PROGRESS");

  const handleStart = () => {
    if (inProgress) {
      router.push(`/candidate/attempts/${inProgress.id}`);
      return;
    }
    setStarting(true);
    start.mutate(undefined, {
      onSuccess: (attempt) => router.push(`/candidate/attempts/${attempt.id}`),
      onError: () => setStarting(false),
    });
  };

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">
              {invitation.assessment?.title ?? "Assessment"}
            </h3>
            <StatusBadge status={invitation.status} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {invitation.assessment?.company?.name
              ? `${invitation.assessment.company.name} · `
              : ""}
            {invitation.assessment?.durationMinutes
              ? `${invitation.assessment.durationMinutes} minutes · `
              : ""}
            {invitation.expiresAt
              ? `expires ${new Date(invitation.expiresAt).toLocaleDateString()}`
              : "no expiry"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {invitation.status === "PENDING" && (
            <>
              <Button size="sm" onClick={onAccept} disabled={accepting}>
                {accepting ? "…" : "Accept"}
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} disabled={rejecting}>
                Decline
              </Button>
            </>
          )}
          {canStart && (
            <Button size="sm" onClick={handleStart} disabled={starting}>
              {starting ? "Starting…" : "Start assessment"}
            </Button>
          )}
          {inProgress && (
            <Button size="sm" asChild>
              <Link href={`/candidate/attempts/${inProgress.id}`}>Resume attempt</Link>
            </Button>
          )}
          {invitation.status === "COMPLETED" && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/candidate/results">View results</Link>
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
