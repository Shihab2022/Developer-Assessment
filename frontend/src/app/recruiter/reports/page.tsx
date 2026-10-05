"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAssessments, useAssessmentReport } from "@/hooks/useAssessments";
import { useExportAssessmentCsv } from "@/hooks/useReports";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { Progress, Spinner } from "@/components/ui/Primitives";
import { Download } from "lucide-react";
import { formatDateTime, formatPercent } from "@/lib/utils";

const Stat = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="rounded-lg border border-border p-4">
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground/80">{hint}</p>}
  </div>
);

export default function ReportsPage() {
  return (
    <Suspense fallback={null}>
      <ReportsContent />
    </Suspense>
  );
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const { data: assessments } = useAssessments({ limit: 100 });
  const [assessmentId, setAssessmentId] = useState(searchParams.get("assessment") ?? "");
  const { data: report, isLoading, isError } = useAssessmentReport(assessmentId || undefined);
  const exportCsv = useExportAssessmentCsv(assessmentId, "assessment-report");

  const options = (assessments?.data ?? []).map((a) => ({ value: a.id, label: a.title }));
  const summary = report?.summary;

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
            Select an assessment to view its report — pick one from the dropdown
            above, or open <b>Reports</b> straight from an assessment&apos;s Results tab.
          </CardBody>
        </Card>
      ) : isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : isError || !report || !summary ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            The report could not be loaded for this assessment. It is generated
            from completed results — try again after candidates submit, or pick
            another assessment.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={report.assessmentTitle ?? "Assessment report"}
              subtitle={`Generated ${report.generatedAt ? formatDateTime(report.generatedAt) : "just now"} · refreshes every 10 minutes`}
            />
            <CardBody>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat
                  label="Completed attempts"
                  value={summary.completedAttempts}
                  hint={`${summary.startedAttempts} started of ${summary.invitationCount} invited`}
                />
                <Stat
                  label="Pass rate"
                  value={formatPercent(summary.passRate)}
                  hint={`${summary.uniqueCandidates} unique candidate${summary.uniqueCandidates === 1 ? "" : "s"}`}
                />
                <Stat
                  label="Average score"
                  value={formatPercent(summary.averageScore)}
                  hint={`range ${summary.lowestScore}% – ${summary.highestScore}%`}
                />
                <Stat
                  label="Avg completion time"
                  value={
                    summary.averageCompletionTimeSeconds
                      ? `${Math.round(summary.averageCompletionTimeSeconds / 60)} min`
                      : "—"
                  }
                  hint={`${formatPercent(summary.completionRate)} completion rate`}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Candidate ranking"
              subtitle="Sorted by score — best performers first"
            />
            <CardBody>
              {(report.candidateRanking ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No results yet. The ranking fills in as soon as candidates submit
                  their attempts.
                </p>
              ) : (
                <div className="space-y-3">
                  {(report.candidateRanking ?? []).map((row, i) => (
                    <div key={row.candidateId ?? i} className="flex items-center gap-4">
                      <span className="w-8 text-sm font-medium text-muted-foreground">#{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {row.name ?? row.candidate?.name ?? "Candidate"}
                          {row.email && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {row.email}
                            </span>
                          )}
                        </p>
                        <Progress value={row.percentage ?? 0} className="mt-1 h-2" />
                      </div>
                      <Badge tone={row.passed ? "green" : "gray"} size="sm">
                        {row.passed ? "Passed" : "Not passed"}
                      </Badge>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {formatPercent(row.percentage ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Question performance"
              subtitle="Where candidates scored — and where they slipped"
            />
            <CardBody className="p-0">
              {(report.questionPerformance ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No graded answers yet — question analytics appear once results exist.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Question</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Attempts</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Correct rate</th>
                      <th className="px-4 py-2 text-right font-medium text-muted-foreground">Avg score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.questionPerformance ?? []).map((q, i) => (
                      <tr key={q.problemId ?? i} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-foreground">
                          {q.problem?.title ?? q.title ?? q.problemId}
                          {q.difficulty && (
                            <Badge size="sm" className="ml-2">{String(q.difficulty)}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {q.attempts ?? q.attemptsCount ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {q.successRate != null ? formatPercent(q.successRate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {q.averageScore != null ? Math.round(q.averageScore * 100) / 100 : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>

          {(report.categoryPerformance ?? []).length > 0 && (
            <Card>
              <CardHeader title="Category performance" subtitle="Accuracy per topic" />
              <CardBody className="space-y-3">
                {(report.categoryPerformance ?? []).map((cat) => (
                  <div key={cat.category} className="flex items-center gap-4">
                    <span className="w-40 truncate text-sm font-medium text-foreground">
                      {cat.category}
                    </span>
                    <Progress value={cat.accuracy} className="h-2 flex-1" />
                    <span className="w-20 text-right text-sm tabular-nums text-muted-foreground">
                      {formatPercent(cat.accuracy)}
                    </span>
                    <span className="w-24 text-right text-xs text-muted-foreground">
                      {cat.attempts} attempt{cat.attempts === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
