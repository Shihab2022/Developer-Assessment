"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { useCurrentUser } from "@/store/auth";
import {
  useCompany, useCompanyAnalytics, useCompanyMembers, useUpdateCompany,
  useInviteCompanyMember, useRemoveCompanyMember, useUpdateCompanyMemberRole,
} from "@/hooks/useCompanies";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextareaField } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Primitives";
import { formatPercent, formatNumber } from "@/lib/utils";
import type { CompanyMemberRole } from "@/lib/types";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-border p-4">
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default function CompanyPage() {
  const me = useCurrentUser();
  const companyId = me?.companyId ?? "";
  const isRestricted = Boolean(me && me.role === "RECRUITER");
  const { data: company, isLoading } = useCompany(isRestricted ? undefined : companyId || undefined);
  const { data: analytics } = useCompanyAnalytics(isRestricted ? undefined : companyId || undefined);
  const { data: members } = useCompanyMembers(isRestricted ? undefined : companyId || undefined);
  const update = useUpdateCompany(companyId);
  const invite = useInviteCompanyMember(companyId);
  const updateRole = useUpdateCompanyMemberRole(companyId);
  const removeMember = useRemoveCompanyMember(companyId);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CompanyMemberRole>("MEMBER");

  // Company management is exposed to company owners & admins only —
  // plain recruiters see an explanation instead.
  if (isRestricted) {
    return (
      <>
        <PageHeader
          title="Company"
          subtitle="Your company's workspace"
        />
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Company management is only available to company owners and admins.
          </CardBody>
        </Card>
      </>
    );
  }

  const copyJoinCode = async () => {
    if (!company?.code) return;
    try {
      await navigator.clipboard.writeText(company.code);
      toast.success("Join code copied");
    } catch {
      toast.error("Could not copy the code");
    }
  };

  if (!me?.companyId) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-muted-foreground">
          You are not part of a company yet. Ask an admin to add you to one.
        </CardBody>
      </Card>
    );
  }

  if (isLoading || !company) return <Spinner className="mx-auto my-12" />;

  return (
    <>
      <PageHeader
        title={company.name}
        subtitle={company.description ?? undefined}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Credit balance" value={formatNumber(company.credits)} />
        <Stat label="Total assessments" value={analytics?.totalAssessments ?? company._count?.assessments ?? 0} />
        <Stat label="Total invitations" value={analytics?.totalInvitations ?? 0} />
        <Stat label="Pass rate" value={analytics ? formatPercent(analytics.passRate) : "—"} />
        <Stat label="Average score" value={analytics ? formatPercent(analytics.averageScore) : "—"} />
        <Stat label="Candidates" value={analytics?.candidateCount ?? 0} />
        <Stat label="Credits consumed" value={analytics?.creditsConsumed ?? 0} />
        <Stat label="Members" value={company._count?.members ?? members?.length ?? 0} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Company profile" />
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                update.mutate({
                  name: String(form.get("name") ?? company.name),
                  description: String(form.get("description") ?? "") || undefined,
                  website: String(form.get("website") ?? "") || undefined,
                  industry: String(form.get("industry") ?? "") || undefined,
                  location: String(form.get("location") ?? "") || undefined,
                });
              }}
              className="space-y-4"
            >
              <TextField label="Name" name="name" defaultValue={company.name} required />
              <TextareaField
                label="Description" name="description" rows={3}
                defaultValue={company.description ?? ""}
              />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Website" name="website" defaultValue={company.website ?? ""} />
                <TextField label="Industry" name="industry" defaultValue={company.industry ?? ""} />
              </div>
              <TextField label="Location" name="location" defaultValue={company.location ?? ""} />
              <Button type="submit" size="sm" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Team & recruiters" />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Company join code
                </p>
                <p className="mt-1 truncate font-mono text-sm font-semibold tracking-widest text-foreground">
                  {company.code ?? "—"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={copyJoinCode}
                  disabled={!company.code}
                  aria-label="Copy join code"
                >
                  <Copy />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/register/recruiter">Open invite page</Link>
                </Button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                invite.mutate(
                  { email: inviteEmail.trim(), role: inviteRole },
                  { onSuccess: () => setInviteEmail("") },
                );
              }}
              className="space-y-3"
            >
              <TextField
                label="Invite a recruiter"
                type="email"
                placeholder="teammate@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                hint="They receive an email with this join code to register as your recruiter."
              />
              <div className="flex items-end gap-3">
                <SelectField
                  label="Role"
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as CompanyMemberRole)}
                  options={[
                    { value: "MEMBER", label: "Member" },
                    { value: "ADMIN", label: "Admin" },
                  ]}
                  className="w-40"
                />
                <Button type="submit" size="sm" loading={invite.isPending}>
                  <UserPlus />
                  Send invite
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              {(members ?? []).map((m) => {
                const isOwner = m.role === "OWNER";
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {m.user?.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{m.user?.email}</p>
                    </div>
                    <SelectField
                      value={m.role}
                      onValueChange={(v) =>
                        updateRole.mutate({ userId: m.userId, role: v as CompanyMemberRole })
                      }
                      options={[
                        { value: "OWNER", label: "Owner", disabled: !isOwner },
                        { value: "ADMIN", label: "Admin", disabled: isOwner },
                        { value: "MEMBER", label: "Member", disabled: isOwner },
                      ]}
                      className="w-32"
                    />
                    {!isOwner && (
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label="Remove member"
                        disabled={removeMember.isPending}
                        onClick={() => removeMember.mutate(m.userId)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {(members ?? []).length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No members yet.</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
