"use client";

import { useState } from "react";
import { useAssessments, useAssessmentInvitations, useInviteCandidates } from "@/hooks/useAssessments";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { TextField } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime, humanizeEnum } from "@/lib/utils";

export default function InvitationsPage() {
  const { data: assessments } = useAssessments({ limit: 100 });
  const [assessmentId, setAssessmentId] = useState("");

  const options = (assessments?.data ?? []).map((a) => ({
    value: a.id,
    label: a.title,
  }));

  return (
    <>
      <PageHeader
        title="Invitations"
        subtitle="Invite candidates and track who has been invited"
      />
      <Card className="mb-4">
        <CardBody>
          <SelectField
            label="Assessment"
            placeholder="Select an assessment"
            value={assessmentId}
            onValueChange={setAssessmentId}
            options={options}
            className="max-w-md"
          />
        </CardBody>
      </Card>

      {assessmentId ? (
        <>
          <InviteForm assessmentId={assessmentId} />
          <InvitationList assessmentId={assessmentId} />
        </>
      ) : (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Select an assessment to manage its invitations.
          </CardBody>
        </Card>
      )}
    </>
  );
}

function InviteForm({ assessmentId }: { assessmentId: string }) {
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const invite = useInviteCandidates(assessmentId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    invite.mutate(
      [{ email: email.trim(), expiresAt: expiresAt || undefined }],
      { onSuccess: () => { setEmail(""); setExpiresAt(""); } },
    );
  };

  return (
    <Card className="mb-4">
      <CardBody>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <TextField
            label="Candidate email"
            type="email"
            required
            placeholder="candidate@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs"
          />
          <TextField
            label="Expires (optional)"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" size="sm" disabled={invite.isPending || !email.trim()}>
            {invite.isPending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Sending an invitation consumes one credit from your company balance.
        </p>
      </CardBody>
    </Card>
  );
}

function InvitationList({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading } = useAssessmentInvitations(assessmentId, { limit: 100 });
  const invitations = data?.data ?? [];

  if (isLoading) return <Spinner className="mx-auto my-12" />;

  return (
    <Card>
      <CardHeader title={`Invitations (${invitations.length})`} />
      <CardBody>
        {invitations.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No invitations for this assessment yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-muted-foreground">Candidate</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Recruitment</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Invited</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Expires</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <p className="font-medium text-foreground">{inv.candidate?.name ?? inv.email}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </td>
                  <td className="py-3"><StatusBadge status={inv.status} /></td>
                  <td className="py-3 text-muted-foreground">{humanizeEnum(inv.recruitmentStatus)}</td>
                  <td className="py-3 text-muted-foreground">
                    {inv.invitedAt ? formatDateTime(inv.invitedAt) : "—"}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {inv.expiresAt ? formatDateTime(inv.expiresAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
