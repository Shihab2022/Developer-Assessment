"use client";

import { useState } from "react";
import { useAssessments, useAssessmentResults } from "@/hooks/useAssessments";
import { useExportAssessmentCsv } from "@/hooks/useReports";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PassedBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { Progress, Spinner } from "@/components/ui/Primitives";
import { Download } from "lucide-react";
import { formatPercent, humanizeEnum } from "@/lib/utils";
import type { Result } from "@/lib/types.platform";

export default function ResultsPage() {
  const { data: assessments } = useAssessments({ limit: 100 });
  const [assessmentId, setAssessmentId] = useState("");
  const { data, isLoading } = useAssessmentResults(
    assessmentId || undefined,
    { limit: 100 },
  );
  const exportCsv = useExportAssessmentCsv(assessmentId, "results");

  const options = (assessments?.data ?? []).map((a) => ({ value: a.id, label: a.title }));
  const results = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Results"
        subtitle="Candidate results across your assessments"
        actions={
          <div className="flex items-center gap-2">
            <SelectField
              placeholder="All assessments"
              value={assessmentId}
              onValueChange={setAssessmentId}
              options={options}
              className="w-64"
            />
            {assessmentId && (
              <Button variant="outline" size="sm" onClick={() => exportCsv.mutate()} disabled={exportCsv.isPending}>
                <Download className="size-4" /> CSV
              </Button>
            )}
          </div>
        }
      />
      {!assessmentId ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Select an assessment to view its results.
          </CardBody>
        </Card>
      ) : isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : results.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            No results for this assessment yet.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-4">
            {results.map((r: Result) => (
              <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {r.candidate?.name ?? "Candidate"}
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {r.candidate?.email}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {humanizeEnum(r.attempt?.status)} ·{" "}
                      {r.timeTakenSeconds ? `${Math.round(r.timeTakenSeconds / 60)} min` : "—"}
                      {r.rank != null ? ` · rank #${r.rank}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {r.earnedPoints} / {r.totalPoints}
                    </span>
                    <PassedBadge passed={r.passed} />
                  </div>
                </div>
                <Progress value={r.percentage} />
              </div>
            ))}
            <p className="text-right text-xs text-muted-foreground">
              Average score:{" "}
              {formatPercent(
                results.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / results.length,
              )}
            </p>
          </CardBody>
        </Card>
      )}
    </>
  );
}
