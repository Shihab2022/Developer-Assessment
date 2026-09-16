"use client";

import { useCurrentUser } from "@/store/auth";
import {
  useCompany, useCompanyAnalytics, useCompanyMembers, useUpdateCompany,
} from "@/hooks/useCompanies";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextareaField } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Primitives";
import { formatPercent, formatNumber } from "@/lib/utils";
import Link from "next/link";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-border p-4">
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default function CompanyPage() {
  const me = useCurrentUser();
  const companyId = me?.companyId ?? "";
  const { data: company, isLoading } = useCompany(companyId || undefined);
  const { data: analytics } = useCompanyAnalytics(companyId || undefined);
  const { data: members } = useCompanyMembers(companyId || undefined);
  const update = useUpdateCompany(companyId);

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
          <CardHeader title="Members" />
          <CardBody className="space-y-2">
            {(members ?? []).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-foreground">{m.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                </div>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </div>
            ))}
            {(members ?? []).length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No members listed.</p>
            )}
            <Button variant="outline" size="sm" asChild className="mt-2">
              <Link href="/recruiter/candidates">View candidates</Link>
            </Button>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
