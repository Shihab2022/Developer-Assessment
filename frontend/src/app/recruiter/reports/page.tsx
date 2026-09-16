"use client";

import { useState } from "react";
import { useAssessments, useAssessmentReport } from "@/hooks/useAssessments";
import { useExportAssessmentCsv } from "@/hooks/useReports";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Select";
import { Progress, Spinner } from "@/components/ui/Primitives";
import { Download } from "lucide-react";
import { formatPercent } from "@/lib/utils";
import type { AssessmentReport as Report } from "@/lib/types.platform";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border border-border p-4">
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default function ReportsPage() {
  const { data: assessments } = useAssessments({ limit: 100 });
  const [assessmentId, setAssessmentId] = useState("");
  const { data: report, isLoading } = useAssessmentReport(assessmentId || undefined);
  const exportCsv = useExportAssessmentCsv(assessmentId, "assessment-report");

  const options = (assessments?.data ?? []).map((a) => ({ value: a.id, label: a.title }));

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Per-assessment performance, question analytics and rankings"
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
                <Download className="size-4" /> Export CSV
              </Button>
            )}
          </div>
        }
      />

      {!assessmentId ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Select an assessment to view its report.
          </CardBody>
        </Card>
      ) : isLoading || !report ? (
        <Spinner className="mx-auto my-12" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Completed" value={report.completedCount} />
            <Stat label="Pass rate" value={formatPercent(report.passRate)} />
            <Stat label="Average score" value={report.averageScore != null ? formatPercent(report.averageScore) : "—"} />
            <Stat
              label="Avg completion"
              value={report.averageCompletionTime ? `${Math.round(report.averageCompletionTime / 60)} min` : "—"}
            />
            <Stat label="Highest score" value={report.highestScore ?? "—"} />
            <Stat label="Lowest score" value={report.lowestScore ?? "—"} />
            <Stat label="Total candidates" value={report.totalCandidates ?? report.candidateCount ?? 0} />
          </div>

          {report.ranking && report.ranking.length > 0 && (
            <Card>
              <CardHeader title="Candidate ranking" />
              <CardBody className="space-y-3">
                {report.ranking.map((row, i) => (
                  <div key={row.candidateId ?? i} className="flex items-center gap-4">
                    <span className="w-8 text-sm font-medium text-muted-foreground">#{row.rank ?? i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.candidate?.name ?? row.candidateId}
                      </p>
                      <Progress value={row.percentage ?? 0} className="mt-1 h-2" />
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {formatPercent(row.percentage ?? 0)}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {report.questionPerformance && report.questionPerformance.length > 0 && (
            <Card>
              <CardHeader title="Question performance" />
              <CardBody className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Question</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Correct rate</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Avg score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.questionPerformance.map((q, i) => (
                      <tr key={q.problemId ?? i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {q.problem?.title ?? q.title ?? q.problemId}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {q.successRate != null ? formatPercent(q.successRate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{q.averageScore ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
