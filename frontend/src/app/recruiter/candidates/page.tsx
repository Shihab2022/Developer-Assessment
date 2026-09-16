"use client";

import { useState } from "react";
import { useCompanies, useCompanyCandidates, useUpdateCandidateStatus } from "@/hooks/useCompanies";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import { RECRUITMENT_STATUSES } from "@/lib/constants";
import type { CompanyCandidateRow } from "@/lib/types";

export default function CandidatesPage() {
  const { data: companies } = useCompanies({ limit: 50 });
  const [companyId, setCompanyId] = useState("");

  const options = (companies?.data ?? []).map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Everyone your company has invited, and where they stand"
      />
      <Card className="mb-4">
        <CardBody>
          <SelectField
            label="Company"
            placeholder="Select a company"
            value={companyId}
            onValueChange={setCompanyId}
            options={options}
            className="max-w-md"
          />
        </CardBody>
      </Card>

      {companyId ? (
        <CandidateTable companyId={companyId} />
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
