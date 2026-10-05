"use client";

import { useState } from "react";
import { useCompanies, useCompanyCandidates, useUpdateCandidateStatus } from "@/hooks/useCompanies";
import { useCurrentUser } from "@/store/auth";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import { RECRUITMENT_STATUSES } from "@/lib/constants";
import type { CompanyCandidateRow } from "@/lib/types";

export default function CandidatesPage() {
  const me = useCurrentUser();
  const isAdmin = me?.role === "ADMIN";
  const ownCompanyId = me?.companyId ?? "";

  // Admins may inspect any company; everyone else is locked to the company they
  // belong to, so a recruiter can only ever see their own organisation's pipeline.
  // Only administrators need the all-company directory to populate the filter.
  // Recruiters use their authenticated company id directly and never fetch it.
  const { data: companies } = useCompanies({ limit: 50 }, { enabled: Boolean(isAdmin) });
  const [companyId, setCompanyId] = useState("");

  const options = (companies?.data ?? []).map((c) => ({ value: c.id, label: c.name }));
  const selectedCompanyId = isAdmin ? companyId : ownCompanyId;
  const ownCompanyName = !isAdmin ? "Your company" : undefined;

  if (!isAdmin && !ownCompanyId) {
    return (
      <>
        <PageHeader
          title="Candidates"
          subtitle="Everyone your company has invited, and where they stand"
        />
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            You are not part of a company yet — ask a company owner to add you to
            their team before reviewing candidates.
          </CardBody>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Everyone your company has invited, and where they stand"
      />

      <Card className="mb-4">
        <CardHeader
          title={isAdmin ? "Filter by company" : ownCompanyName ?? "Your company"}
          subtitle={
            isAdmin
              ? "Platform admins can review any company's candidate pipeline."
              : "You only see candidates invited by your own organisation."
          }
        />
        <CardBody>
          {isAdmin ? (
            <SelectField
              label="Company"
              placeholder="Select a company"
              value={companyId}
              onValueChange={setCompanyId}
              options={options}
              className="max-w-md"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Candidates are scoped to <b>{ownCompanyName ?? "your company"}</b>.
            </p>
          )}
        </CardBody>
      </Card>

      {selectedCompanyId ? (
        <CandidateTable companyId={selectedCompanyId} />
      ) : (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Select a company to view its candidates.
          </CardBody>
        </Card>
      )}
    </>
  );
}

function CandidateTable({ companyId }: { companyId: string }) {
  const { data, isLoading } = useCompanyCandidates(companyId, { limit: 100 });
  const updateStatus = useUpdateCandidateStatus(companyId);
  const rows = data?.data ?? [];

  if (isLoading) return <Spinner className="mx-auto my-12" />;

  return (
    <Card>
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No candidates for this company yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Candidate</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Assessment</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Invitation</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Result</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Recruitment stage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: CompanyCandidateRow) => (
                <tr key={row.invitationId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {row.candidate?.name ?? row.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.assessment?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.invitationStatus} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(row.invitedAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {row.result ? `${Math.round(row.result.percentage)}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <SelectField
                      value={row.recruitmentStatus}
                      onValueChange={(v) =>
                        updateStatus.mutate({
                          invitationId: row.invitationId,
                          payload: { recruitmentStatus: v as CompanyCandidateRow["recruitmentStatus"] },
                        })
                      }
                      options={RECRUITMENT_STATUSES.map((s) => ({
                        value: s,
                        label: humanizeEnum(s),
                      }))}
                      className="w-36"
                    />
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
