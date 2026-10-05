"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAssessments, useAssessmentSubmissions } from "@/hooks/useAssessments";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import { languageLabel } from "@/lib/constants";
import type { Submission } from "@/lib/types.platform";

export default function SubmissionsPage() {
  return (
    <Suspense fallback={null}>
      <SubmissionsContent />
    </Suspense>
  );
}

function SubmissionsContent() {
  const searchParams = useSearchParams();
  const { data: assessments } = useAssessments({ limit: 100 });
  const [assessmentId, setAssessmentId] = useState(searchParams.get("assessment") ?? "");
  const { data, isLoading, isError } = useAssessmentSubmissions(
    assessmentId || undefined,
    { limit: 100 },
  );

  const options = (assessments?.data ?? []).map((a) => ({ value: a.id, label: a.title }));
  const submissions = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Submissions"
        subtitle="Code and written answers submitted by candidates across your assessments"
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
            Select an assessment to view its submissions. Coding answers are scored
            automatically against the hidden test cases; written answers queue for
            manual evaluation.
          </CardBody>
        </Card>
      ) : isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : isError ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Submissions could not be loaded for this assessment. You may not have
            access to it, or the exam was removed.
          </CardBody>
        </Card>
      ) : submissions.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            No submissions for this assessment yet — they appear here as soon as
            candidates start answering questions.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Candidate</th>
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
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {s.candidate?.name ?? "Candidate"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.candidate?.email ?? ""}
                      </p>
                    </td>
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
