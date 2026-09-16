"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api, { getErrorMessage } from "@/lib/api";
import type { AssessmentAnalytics, AssessmentReport, Result } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatCard, LoadingBlock, EmptyState } from "@/components/ui/Misc";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils";

const BAR_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#f472b6"];

export function ReportTab({ assessmentId }: { assessmentId: string }) {
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [analytics, setAnalytics] = useState<AssessmentAnalytics | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      api.get(`/assessments/${assessmentId}/report`),
      api.get(`/assessments/${assessmentId}/analytics`),
      api.get(`/assessments/${assessmentId}/results`, { params: { limit: 50 } }),
    ]).then(([r, a, res]) => {
      if (r.status === "fulfilled") setReport(r.value.data?.data);
      if (a.status === "fulfilled") setAnalytics(a.value.data?.data);
      if (res.status === "fulfilled") setResults(res.value.data?.data ?? []);
      setLoading(false);
    });
  }, [assessmentId]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get(`/assessments/${assessmentId}/report/export.csv`, { responseType: "blob" });
      const disposition: string = res.headers["content-disposition"] ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "assessment-report.csv";
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported as CSV");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingBlock />;

  const dist = analytics?.performanceDistribution ?? analytics?.scoreDistribution ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" loading={exporting} onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Candidates" value={report?.totalCandidates ?? report?.candidateCount ?? 0} hint={`${report?.completedCount ?? 0} completed`} />
        <StatCard label="Average score" value={`${Math.round(report?.averageScore ?? analytics?.averageScore ?? 0)}%`} tone="blue" hint={analytics?.medianScore !== undefined ? `median ${analytics.medianScore}%` : undefined} />
        <StatCard label="Pass rate" value={`${Math.round(report?.passRate ?? analytics?.passRate ?? 0)}%`} tone="green" />
        <StatCard label="Avg. completion time" value={formatDuration(report?.averageCompletionTime ?? analytics?.averageTime)} tone="violet" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {dist.length > 0 && (
          <Card>
            <CardHeader title="Score distribution" subtitle="Candidates per score band" />
            <CardBody className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {dist.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {(report?.questionPerformance?.length ?? 0) > 0 && (
          <Card>
            <CardHeader title="Question performance" subtitle="Average score per question" />
            <CardBody className="h-64 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={(report?.questionPerformance ?? []).slice(0, 8).map((q, i) => ({
                    name: q.title ? `Q${i + 1}` : `Q${i + 1}`,
                    pct: Math.round(q.averagePercentage ?? q.successRate ?? 0),
                    title: q.title,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(_, p) => (p?.[0]?.payload?.title as string) ?? ""} />
                  <Bar dataKey="pct" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Ranking table */}
      {results.length > 0 && (
        <Card>
          <CardHeader title="Candidate ranking" subtitle="All results ordered by score" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Candidate</th>
                  <th className="px-5 py-3 text-right font-medium">Points</th>
                  <th className="px-5 py-3 text-right font-medium">Percentage</th>
                  <th className="px-5 py-3 text-right font-medium">Time</th>
                  <th className="px-5 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-bold text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{r.candidate?.name ?? "Candidate"}</p>
                      <p className="text-xs text-slate-400">{r.candidate?.email}</p>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">{r.earnedPoints}/{r.totalPoints}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{r.percentage}%</td>
                    <td className="px-5 py-3 text-right text-slate-600">{formatDuration(r.timeTakenSeconds)}</td>
                    <td className="px-5 py-3 text-right"><StatusBadge status={r.passed ? "COMPLETED" : "FAILED"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {loading === false && !report && !analytics && results.length === 0 && (
        <EmptyState title="No report data yet" description="Reports become available once candidates start attempting." />
      )}

    </div>
  );
}
