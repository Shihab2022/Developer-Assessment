"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAssessments, useAssessmentInvitations, useInviteCandidates } from "@/hooks/useAssessments";
import { Card, CardBody, CardHeader, PageHeader, DescriptionList } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { TextField, TextareaField } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Primitives";
import { Download, Mail } from "lucide-react";
import { downloadBlob, formatDateTime, humanizeEnum, isEmail } from "@/lib/utils";

/** One pasted row from the bulk box. */
interface BulkRow {
  email: string;
  expiresAt?: string;
}

/**
 * Accepts the documented bulk format:
 *   • one email per line, or comma / semicolon separated
 *   • optional CSV rows: `email,expiresAt` (ISO date)
 * Returns the valid, de-duplicated rows plus any unparseable tokens.
 */
function parseBulkEmails(raw: string): { rows: BulkRow[]; invalid: string[] } {
  const rows: BulkRow[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const parts = trimmed.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    const expiry = parts.find((p) => !isEmail(p) && !Number.isNaN(Date.parse(p)));
    for (const part of parts) {
      if (part === expiry) continue;
      const email = part.toLowerCase();
      if (!isEmail(email)) {
        invalid.push(part);
        continue;
      }
      if (seen.has(email)) continue;
      seen.add(email);
      rows.push({
        email,
        expiresAt: expiry ? new Date(expiry).toISOString() : undefined,
      });
    }
  }
  return { rows, invalid };
}

function downloadSample() {
  const sample = [
    "email,expiresAt",
    "ada@example.com,2026-12-31T23:59:00Z",
    "grace@example.com,",
    "alan@example.com,",
  ].join("\n");
  downloadBlob(new Blob([sample], { type: "text/csv;charset=utf-8;" }), "invitation-emails-sample.csv");
}

export default function InvitationsPage() {
  return (
    <Suspense fallback={null}>
      <InvitationsContent />
    </Suspense>
  );
}

function InvitationsContent() {
  const searchParams = useSearchParams();
  const { data: assessments } = useAssessments({ limit: 100 });
  const [assessmentId, setAssessmentId] = useState(searchParams.get("assessment") ?? "");

  const options = (assessments?.data ?? []).map((a) => ({
    value: a.id,
    label: a.title,
  }));

  return (
    <>
      <PageHeader
        title="Invitations"
        subtitle="Invite candidates by email — one at a time or paste a whole cohort"
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
          <InviteForm key={assessmentId} assessmentId={assessmentId} />
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
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [bulk, setBulk] = useState("");
  const invite = useInviteCandidates(assessmentId);

  const parsed = useMemo(() => parseBulkEmails(bulk), [bulk]);
  const validCount = parsed.rows.length;
  const invalidCount = parsed.invalid.length;

  const submitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    invite.mutate(
      [{ email: email.trim(), expiresAt: expiresAt || undefined }],
      { onSuccess: () => { setEmail(""); setExpiresAt(""); } },
    );
  };

  const submitBulk = () => {
    if (validCount === 0) return;
    invite.mutate(parsed.rows, { onSuccess: () => setBulk("") });
  };

  return (
    <Card className="mb-4">
      <CardHeader
        title="Send invitations"
        action={
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {(["single", "bulk"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  mode === m ? "bg-primary-600 text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "single" ? "Single email" : "Multiple emails"}
              </button>
            ))}
          </div>
        }
      />
      <CardBody>
        {mode === "single" ? (
          <form onSubmit={submitSingle} className="flex flex-wrap items-end gap-3">
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
              <Mail className="size-4" />
              {invite.isPending ? "Sending…" : "Send invitation"}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <TextareaField
              label="Paste email addresses"
              rows={7}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={"ada@example.com\ngrace@example.com\nalan@example.com"}
              hint="One email per line. Commas or semicolons also work."
            />

            <DescriptionList
              columns={2}
              items={[
                { label: "Accepted format", value: "one email per line, or comma / semicolon separated" },
                {
                  label: "Optional expiry column (CSV)",
                  value: <code className="text-xs">email,2026-12-31T23:59:00Z</code>,
                },
              ]}
            />

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">
                <b className="text-foreground">{validCount}</b> ready to invite
                {invalidCount > 0 && (
                  <>
                    {" · "}
                    <span className="text-destructive">{invalidCount} skipped (not a valid email)</span>
                  </>
                )}
              </span>
              <Button variant="outline" size="sm" onClick={downloadSample}>
                <Download className="size-4" /> Download sample CSV
              </Button>
              <Button
                size="sm"
                onClick={submitBulk}
                disabled={invite.isPending || validCount === 0}
              >
                <Mail className="size-4" />
                {invite.isPending ? "Sending…" : `Send ${validCount || ""} invitation${validCount === 1 ? "" : "s"}`}
              </Button>
            </div>
            {invalidCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Skipped: {parsed.invalid.slice(0, 8).join(", ")}
                {parsed.invalid.length > 8 ? "…" : ""}
              </p>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Sending an invitation consumes one credit per candidate from your company
          balance. Candidates already invited are skipped automatically.
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
