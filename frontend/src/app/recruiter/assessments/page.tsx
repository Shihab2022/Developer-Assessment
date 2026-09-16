"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useDebouncedValue } from "@/hooks/useUi";
import { useAssessments, useDeleteAssessment, useAssessmentLifecycle } from "@/hooks/useAssessments";
import { useState } from "react";
import { Card, CardHeader, CardBody, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { Trash2, Edit, RefreshCw, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ASSESSMENT_STATUSES, DEFAULT_PAGE_SIZE } from "@/lib/constants";

function AssessmentActions({ assessmentId, status }: { assessmentId: string; status: string }) {
  const lifecycle = useAssessmentLifecycle(assessmentId);
  const del = useDeleteAssessment();

  const nextAction =
    status === "DRAFT" ? "publish"
    : status === "PUBLISHED" ? "close"
    : status === "ACTIVE" ? "close"
    : status === "CLOSED" ? "archive"
    : null;

  return (
    <>
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/recruiter/assessments/${assessmentId}`}>
          <ExternalLink className="size-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/recruiter/assessments/${assessmentId}/edit`}>
          <Edit className="size-4" />
        </Link>
      </Button>
      {nextAction && (
        <Button
          variant="ghost" size="sm"
          onClick={() => lifecycle.mutate(nextAction as "publish" | "close" | "archive" | "restore")}
          disabled={lifecycle.isPending}
        >
          <RefreshCw className="size-4" />
        </Button>
      )}
      <Button
        variant="ghost" size="sm"
        onClick={() => { if (confirm("Archive this assessment? This cannot be undone.")) del.mutate(assessmentId); }}
        disabled={del.isPending}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </>
    );
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={null}>
      <AssessmentsContent />
    </Suspense>
  );
}

function AssessmentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? DEFAULT_PAGE_SIZE);

  const debouncedQ = useDebouncedValue(q, 350);
  const [searchInput, setSearchInput] = useState(q);

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.replace(`?${params.toString()}`);
  };

  const { data } = useAssessments({
    q: debouncedQ,
    status: statusFilter || undefined,
    page,
    limit,
  });

  const assessments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle="Manage your coding and hiring assessments"
        actions={<Button size="sm" asChild><Link href="/recruiter/assessments/new">Create assessment</Link></Button>}
      />
      <Card>
        <CardHeader title="All assessments" />
        <CardBody>
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Search assessments..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); updateUrl({ q: e.target.value, page: "1" }); }}
              className="max-w-sm"
            />
            <SelectField
              placeholder="All statuses"
              value={statusFilter || ""}
              onValueChange={(v) => updateUrl({ status: v, page: "1" })}
              options={ASSESSMENT_STATUSES.map((s) => ({ value: s, label: s }))}
              className="w-40"
            />
          </div>
          <div className="thin-scrollbar max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Duration</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Link href={`/recruiter/assessments/${a.id}`} className="font-medium text-foreground hover:underline">
                        {a.title}
                      </Link>
                      {a._count && (
                        <p className="text-xs text-muted-foreground">
                          {a._count.problems ?? 0} problems · {a._count.invitations ?? 0} invitations
                        </p>
                      )}
                    </td>
                    <td className="py-3"><StatusBadge status={a.status} /></td>
                    <td className="py-3 text-muted-foreground">{a.durationMinutes ? `${a.durationMinutes} min` : "—"}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <AssessmentActions assessmentId={a.id} status={a.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assessments.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No assessments found. Create one to get started.
            </p>
          )}
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex justify-between text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}

