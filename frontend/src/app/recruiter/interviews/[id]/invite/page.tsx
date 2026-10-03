"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Users } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Primitives";
import { InterviewInviteCard } from "@/components/interviews/InterviewInviteCard";
import {
  useInterview,
  useInterviewSessions,
  useResendInterviewInvite,
} from "@/hooks/useInterviews";
import { copyToClipboard, formatDateTime } from "@/lib/utils";
import { toast } from "sonner";

/**
 * `/recruiter/interviews/:id/invite` — the recruiter/admin invites candidates to
 * an exam, either by typing an email or by picking an existing user who has
 * already sat other exams. Every invitation emails a personal, secured link.
 */
export default function InviteCandidatesPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const interview = useInterview(id);
  const sessions = useInterviewSessions(id, { page: 1, limit: 100 });
  const resend = useResendInterviewInvite(id);

  if (interview.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (interview.isError || !interview.data) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-muted-foreground">
          This interview could not be loaded.
        </CardBody>
      </Card>
    );
  }

  const rows = sessions.data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Invite candidates"
        subtitle={`Send the ${interview.data.title} exam link by email`}
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/recruiter/interviews/${id}`}>
              <ArrowLeft className="size-4" />
              Back to interview
            </Link>
          </Button>
        }
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link href={`/recruiter/interviews/${id}`}>
              <Users className="size-4" />
              All sessions
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <InterviewInviteCard interviewId={id} />

        <Card>
          <CardHeader
            title={`Invited candidates (${rows.length})`}
            subtitle="Each candidate owns one personal link bound to their email"
          />
          <CardBody>
            {sessions.isPending ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={row} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nobody invited yet — use the form on the left to send the first invitation.
              </p>
            ) : (
              <ul className="thin-scrollbar max-h-[520px] space-y-2 overflow-y-auto">
                {rows.map((session) => (
                  <li
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {session.candidateName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {session.candidateEmail}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <StatusBadge status={session.status} />
                        <Badge tone={session.emailVerifiedAt ? "green" : "amber"} size="sm">
                          {session.emailVerifiedAt ? "Email verified" : "Not verified"}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {session.emailSentAt
                            ? `Sent ${formatDateTime(session.emailSentAt)}`
                            : "Not emailed yet"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label="Copy personal link"
                        onClick={() => {
                          void copyToClipboard(session.link ?? "").then((ok) =>
                            toast[ok ? "success" : "error"](
                              ok ? "Personal link copied" : "Could not copy the link",
                            ),
                          );
                        }}
                      >
                        <Mail className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resend.mutate(session.id)}
                        loading={resend.isPending}
                      >
                        Resend email
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
