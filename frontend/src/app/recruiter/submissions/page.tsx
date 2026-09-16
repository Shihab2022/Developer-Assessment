"use client";

import { useState } from "react";
import { useAssessments, useAssessmentSubmissions } from "@/hooks/useAssessments";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import { languageLabel } from "@/lib/constants";
import type { Submission } from "@/lib/types.platform";

export default function SubmissionsPage() {
  const { data: assessments } = useAssessments({ limit: 100 });
  const [assessmentId, setAssessmentId] = useState("");
  const { data, isLoading } = useAssessmentSubmissions(
    assessmentId || undefined,
    { limit: 100 },
  );

  const options = (assessments?.data ?? []).map((a) => ({ value: a.id, label: a.title }));
  const submissions = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Code and written answers submitted by candidates"
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

      {!assessmentId ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Select an assessment to view its submissions.
          </CardBody>
        </Card>
      ) : isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : submissions.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            No submissions for this assessment yet.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Problem</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Language</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s: Submission) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {s.problem?.title ?? "Problem"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {languageLabel(s.programmingLanguage)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.submittedAt ? formatDateTime(s.submittedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {s.score != null ? s.score : humanizeEnum(s.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </>
  );
}
