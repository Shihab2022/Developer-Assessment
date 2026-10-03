"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Copy, ExternalLink, Plus, RefreshCw, Video } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Primitives";
import { useInterviewLifecycle, useInterviews } from "@/hooks/useInterviews";
import { useDebouncedValue } from "@/hooks/useUi";
import {
  DEFAULT_PAGE_SIZE,
  INTERVIEW_SENIORITY_LABELS,
  INTERVIEW_STATUSES,
} from "@/lib/constants";
import { copyToClipboard } from "@/lib/utils";

function InterviewActions({ interviewId, status }: { interviewId: string; status: string }) {
  const lifecycle = useInterviewLifecycle(interviewId);

  return (
    <>
      <Button variant="ghost" size="iconSm" asChild aria-label="Open interview">
        <Link href={`/recruiter/interviews/${interviewId}`}>
          <ExternalLink className="size-4" />
        </Link>
      </Button>
      {status === "DRAFT" && (
        <Button
          variant="ghost"
          size="iconSm"
          aria-label="Publish"
          disabled={lifecycle.isPending}
          onClick={() => lifecycle.mutate("publish")}
        >
          <Video className="size-4 text-emerald-600" />
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button
          variant="ghost"
          size="iconSm"
          aria-label="Close to new candidates"
          disabled={lifecycle.isPending}
          onClick={() => lifecycle.mutate("close")}
        >
          <RefreshCw className="size-4 text-amber-600" />
        </Button>
      )}
    </>
  );
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={null}>
      <InterviewsContent />
    </Suspense>
  );
}

function InterviewsContent() {
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
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`?${params.toString()}`);
  };

  const { data, isPending } = useInterviews({
    q: debouncedQ,
    status: (statusFilter || undefined) as (typeof INTERVIEW_STATUSES)[number] | undefined,
    page,
    limit,
  });

  const interviews = data?.data ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHeader
        title="AI video interviews"
        subtitle="Proctored camera + microphone interviews, marked by AI"
        actions={
          <Button size="sm" asChild>
            <Link href="/recruiter/interviews/new">
              <Plus className="size-4" />
              New interview
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader title="All interviews" />
        <CardBody>
          <div className="mb-4 flex gap-3">
            <Input
              placeholder="Search interviews..."
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                updateUrl({ q: event.target.value, page: "1" });
              }}
              className="max-w-sm"
            />
            <SelectField
              placeholder="All statuses"
              value={statusFilter}
              onValueChange={(value) => updateUrl({ status: value, page: "1" })}
              options={INTERVIEW_STATUSES.map((status) => ({ value: status, label: status }))}
              className="w-40"
            />
          </div>

          <div className="thin-scrollbar max-h-[560px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Interview</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Questions</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Sessions</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isPending &&
                  [0, 1, 2, 3, 4].map((row) => (
                    <tr key={`sk-${row}`} className="border-b border-border last:border-0">
                      <td colSpan={5} className="py-3">
                        <Skeleton className="h-9 w-full" />
                      </td>
                    </tr>
                  ))}
                {!isPending &&
                interviews.map((interview) => (
                  <tr key={interview.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/recruiter/interviews/${interview.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {interview.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {interview.technology.toUpperCase()} ·{" "}
                        {INTERVIEW_SENIORITY_LABELS[interview.seniority] ?? interview.seniority} ·{" "}
                        {interview.questionTimeSeconds}s per question
                      </p>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={interview.status} />
                    </td>
                    <td className="py-3 text-muted-foreground">{interview.questionTotal ?? 0}</td>
                    <td className="py-3 text-muted-foreground">{interview.sessionTotal ?? 0}</td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          aria-label="Copy candidate link"
                          onClick={() => {
                            void copyToClipboard(interview.candidateLink ?? "").then((ok) =>
                              toast[ok ? "success" : "error"](
                                ok ? "Candidate link copied" : "Could not copy the link",
                              ),
                            );
                          }}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <InterviewActions interviewId={interview.id} status={interview.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isPending && interviews.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No interviews yet — create one to draw a random question set for a technology and
              share the candidate link.
            </p>
          )}

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex justify-between text-sm text-muted-foreground">
              <span>
                Page {meta.page} of {meta.totalPages}
              </span>
              <span>{meta.total} interviews</span>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}

