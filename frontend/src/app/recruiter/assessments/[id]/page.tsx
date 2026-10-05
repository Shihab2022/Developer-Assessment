"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  useAssessment,
  useAssessmentInvitations,
  useAssessmentLifecycle,
  useAssessmentProblems,
  useAssessmentResults,
  useAddAssessmentProblem,
  useRemoveAssessmentProblem,
  useUpdateAssessmentProblem,
} from "@/hooks/useAssessments";
import { useProblems } from "@/hooks/useProblems";
import { Card, CardBody, CardHeader, PageHeader, DescriptionList } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextField } from "@/components/ui/Input";
import { Badge, StatusBadge, DifficultyBadge, TypeBadge, PassedBadge } from "@/components/ui/Badge";
import { Spinner, Progress, Alert, AlertTitle, AlertDescription } from "@/components/ui/Primitives";
import { Modal, ModalContent, ModalHeader } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/Select";
import { formatDateTime, formatPercent, humanizeEnum, pluralize } from "@/lib/utils";
import { Plus, Mail, ExternalLink, X } from "lucide-react";
import type { AssessmentProblem, Problem } from "@/lib/types";

const TABS = ["Overview", "Problems", "Invitations", "Results"] as const;
type Tab = (typeof TABS)[number];

export default function AssessmentDetailPage() {
  return (
    <Suspense fallback={null}>
      <AssessmentDetailContent />
    </Suspense>
  );
}

function AssessmentDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id ?? "";
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "Overview";
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab) ? initialTab : "Overview");
  const { data: assessment, isLoading } = useAssessment(id);
  const lifecycle = useAssessmentLifecycle(id);

  if (isLoading) return <Spinner className="mx-auto my-12" />;
  if (!assessment) return <p className="my-12 text-center text-muted-foreground">Assessment not found.</p>;

  const nextAction =
    assessment.status === "DRAFT" ? ("publish" as const)
    : assessment.status === "PUBLISHED" || assessment.status === "ACTIVE" ? ("close" as const)
    : assessment.status === "CLOSED" ? ("archive" as const)
    : null;

  const problems = assessment._count?.problems ?? 0;
  const invitations = assessment._count?.invitations ?? 0;

  return (
    <>
      <PageHeader
        title={assessment.title}
        subtitle={assessment.description ?? undefined}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/recruiter/assessments/${id}/edit`}>Edit</Link>
            </Button>
            {nextAction && (
              <Button size="sm" onClick={() => lifecycle.mutate(nextAction)} disabled={lifecycle.isPending}>
                {nextAction === "publish" ? "Publish" : nextAction === "close" ? "Close" : "Archive"}
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <MetaStat label="Status" value={<StatusBadge status={assessment.status} />} />
        <MetaStat
          label="Duration"
          value={assessment.durationMinutes ? `${assessment.durationMinutes} min` : "—"}
        />
        <MetaStat
          label="Pass mark"
          value={assessment.passingScore != null ? `${assessment.passingScore}%` : "—"}
        />
        <MetaStat label="Problems" value={String(problems)} />
        <MetaStat label="Invitations" value={String(invitations)} />
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              const next = new URLSearchParams(searchParams);
              if (t === "Overview") next.delete("tab");
              else next.set("tab", t);
              router.replace(
                next.size
                  ? `/recruiter/assessments/${id}?${next.toString()}`
                  : `/recruiter/assessments/${id}`,
              );
            }}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-primary-600 text-primary-700 dark:text-primary-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab assessmentId={id} />}
      {tab === "Problems" && <ProblemsTab assessmentId={id} />}
      {tab === "Invitations" && <InvitationsTab assessmentId={id} />}
      {tab === "Results" && <ResultsTab assessmentId={id} />}
    </>
  );
}

function MetaStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function OverviewTab({ assessmentId }: { assessmentId: string }) {
  const { data: assessment } = useAssessment(assessmentId);
  if (!assessment) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Assessment settings" />
        <CardBody>
          <DescriptionList
            items={[
              { label: "Access", value: (assessment.accessLevel ?? "").replace(/_/g, " ") || "—" },
              { label: "Result strategy", value: (assessment.resultStrategy ?? "").replace(/_/g, " ") || "—" },
              {
                label: "Window",
                value: `${assessment.startDate ? formatDateTime(assessment.startDate) : "No start"} → ${assessment.endDate ? formatDateTime(assessment.endDate) : "no end"}`,
              },
              { label: "Max attempts", value: assessment.maxAttempts ?? "—" },
              { label: "Anti-cheating", value: assessment.antiCheatingEnabled ? "Enabled" : "Disabled" },
              { label: "Shuffle problems", value: assessment.shuffleProblems ? "Yes" : "No" },
              { label: "Show results to candidates", value: assessment.showResults ? "Yes" : "No" },
            ]}
          />
          {assessment.instructions && (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Instructions</h3>
              <p className="whitespace-pre-wrap text-sm">{assessment.instructions}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {assessment.status === "DRAFT" && (
        <Alert variant="info">
          <div>
            <AlertTitle>Workflow checklist</AlertTitle>
            <AlertDescription>
              1 · Add questions on the <b>Problems</b> tab → 2 · <b>Publish</b> the assessment
              (uses one company credit) → 3 · send <b>Invitations</b> → 4 · watch <b>Results</b>.
            </AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Add questions from the question bank. Platform (uuid-keyed) problems can be
 * attached directly; legacy js-style bank ids are listed for reference only.
 */
function AddProblemsModal({
  open,
  onOpenChange,
  assessmentId,
  attachedIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  attachedIds: Set<string>;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const { data, isLoading } = useProblems({
    q: q || undefined,
    type: (type || undefined) as "CODING" | "MCQ" | "WRITTEN",
    limit: 50,
  });
  const add = useAddAssessmentProblem(assessmentId);

  const rows = (data?.data ?? []) as Problem[];
  const attachable = rows.filter((p) => !attachedIds.has(p.id) && isUuid(p.id));

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader title="Add questions from the bank" />
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search the question bank..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <SelectField
              placeholder="All types"
              value={type}
              onValueChange={setType}
              options={[
                { value: "CODING", label: "Coding" },
                { value: "MCQ", label: "MCQ" },
                { value: "WRITTEN", label: "Written" },
              ]}
              className="w-36"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Only questions already saved in the bank can be linked. Create new
            questions first on the <Link href="/recruiter/problems" className="text-primary-600 hover:underline">Question bank</Link> page.
          </p>
          {isLoading ? (
            <Spinner className="mx-auto my-8" />
          ) : attachable.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing new matches — all matching questions are already attached.
            </p>
          ) : (
            <div className="thin-scrollbar max-h-80 space-y-2 overflow-y-auto">
              {attachable.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{p.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <TypeBadge type={p.type} />
                      <DifficultyBadge difficulty={p.difficulty} />
                      <span>{p.points} pts</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => add.mutate({ problemId: p.id, points: p.points })}
                    disabled={add.isPending}
                  >
                    <Plus className="size-4" /> Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

function ProblemsTab({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading } = useAssessmentProblems(assessmentId, { limit: 100 });
  const remove = useRemoveAssessmentProblem(assessmentId);
  const update = useUpdateAssessmentProblem(assessmentId);
  const [addOpen, setAddOpen] = useState(false);

  const rows = data?.data ?? [];
  const attachedIds = new Set(rows.map((r: AssessmentProblem) => r.problemId));

  return (
    <Card>
      <CardHeader
        title={`Problems (${rows.length})`}
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add questions
          </Button>
        }
      />
      <CardBody>
        {isLoading ? (
          <Spinner className="mx-auto my-8" />
        ) : rows.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No questions attached yet. Add questions from your question bank —
              CODING, MCQ or written — or create new ones first.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" /> Add questions
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/recruiter/problems">
                  <ExternalLink className="size-4" /> Open question bank
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row: AssessmentProblem, index: number) => (
              <div
                key={row.id ?? row.problemId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    <span className="mr-2 text-xs tabular-nums text-muted-foreground">Q{index + 1}</span>
                    {row.problem?.title ?? "Problem"}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {row.problem?.type && <TypeBadge type={row.problem.type} />}
                    {row.problem?.difficulty && <DifficultyBadge difficulty={row.problem.difficulty} />}
                    {row.section && <Badge size="sm">{row.section}</Badge>}
                    {row.isRequired && <Badge size="sm" tone="amber">Required</Badge>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TextField
                    aria-label="Points"
                    type="number"
                    min={1}
                    className="w-20"
                    value={row.points}
                    onChange={(e) =>
                      update.mutate({ problemId: row.problemId, payload: { points: Number(e.target.value) } })
                    }
                  />
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => {
                      if (confirm("Remove this problem from the assessment?")) remove.mutate(row.problemId);
                    }}
                    disabled={remove.isPending}
                    title="Remove problem"
                  >
                    <X className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              Total: {pluralize(rows.length, "question")} ·{" "}
              {rows.reduce((sum, r) => sum + (r.points ?? 0), 0)} points.
            </p>
          </div>
        )}
      </CardBody>
      <AddProblemsModal
        open={addOpen}
        onOpenChange={setAddOpen}
        assessmentId={assessmentId}
        attachedIds={attachedIds}
      />
    </Card>
  );
}

function InvitationsTab({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading } = useAssessmentInvitations(assessmentId, { limit: 100 });
  const invitations = data?.data ?? [];

  return (
    <Card>
      <CardHeader
        title={`Invitations (${invitations.length})`}
        action={
          <Button size="sm" asChild>
            <Link href={`/recruiter/invitations?assessment=${assessmentId}`}>
              <Mail className="size-4" /> Send invitations
            </Link>
          </Button>
        }
      />
      <CardBody>
        {isLoading ? (
          <Spinner className="mx-auto my-8" />
        ) : invitations.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nobody invited yet. Invite candidates by email from the Invitations page.
            </p>
            <Button size="sm" asChild className="mt-4">
              <Link href={`/recruiter/invitations?assessment=${assessmentId}`}>Open invitations</Link>
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-muted-foreground">Candidate</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Stage</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Invited</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <p className="font-medium text-foreground">{inv.candidate?.name ?? inv.email}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </td>
                  <td className="py-3"><StatusBadge status={inv.status} /></td>
                  <td className="py-3 text-muted-foreground">{humanizeEnum(inv.recruitmentStatus)}</td>
                  <td className="py-3 text-muted-foreground">
                    {inv.invitedAt ? formatDateTime(inv.invitedAt) : "—"}
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

function ResultsTab({ assessmentId }: { assessmentId: string }) {
  const { data, isLoading } = useAssessmentResults(assessmentId, { limit: 100 });
  const results = data?.data ?? [];

  return (
    <Card>
      <CardHeader
        title={`Results (${results.length})`}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/recruiter/reports?assessment=${assessmentId}`}>
              <ExternalLink className="size-4" /> Full report
            </Link>
          </Button>
        }
      />
      <CardBody>
        {isLoading ? (
          <Spinner className="mx-auto my-8" />
        ) : results.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No results yet — share the invitations and results will appear here once
              candidates finish the exam.
            </p>
            <Button size="sm" asChild className="mt-4">
              <Link href={`/recruiter/invitations?assessment=${assessmentId}`}>Invite candidates</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((r) => (
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
          </div>
        )}
      </CardBody>
    </Card>
  );
}
