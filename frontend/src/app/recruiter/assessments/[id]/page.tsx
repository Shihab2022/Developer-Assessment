"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAssessment, useAssessmentLifecycle } from "@/hooks/useAssessments";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge, DifficultyBadge, TypeBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";

const TABS = ["Overview", "Problems", "Invitations", "Results"] as const;
type Tab = (typeof TABS)[number];

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("Overview");
  const { data: assessment, isLoading } = useAssessment(id);
  const lifecycle = useAssessmentLifecycle(id);

  if (isLoading) return <Spinner className="mx-auto my-12" />;
  if (!assessment) return <p className="my-12 text-center text-muted-foreground">Assessment not found.</p>;

  const nextAction =
    assessment.status === "DRAFT" ? ("publish" as const)
    : assessment.status === "PUBLISHED" || assessment.status === "ACTIVE" ? ("close" as const)
    : assessment.status === "CLOSED" ? ("archive" as const)
    : null;

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

      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={assessment.status} />
        <span className="text-sm text-muted-foreground">
          {assessment.durationMinutes} min · pass {assessment.passingScore}% ·{" "}
          {assessment._count?.problems ?? 0} problems · {assessment._count?.invitations ?? 0} invitations
        </span>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
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

      {tab === "Overview" && (
        <Card>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Access</h3>
              <p>{assessment.accessLevel.replace(/_/g, " ")}</p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Result strategy</h3>
              <p>{assessment.resultStrategy.replace(/_/g, " ")}</p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Window</h3>
              <p>
                {assessment.startDate ? new Date(assessment.startDate).toLocaleDateString() : "—"} →{" "}
                {assessment.endDate ? new Date(assessment.endDate).toLocaleDateString() : "—"}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">Anti-cheating</h3>
              <p>{assessment.antiCheatingEnabled ? "Enabled" : "Disabled"}</p>
            </div>
            {assessment.instructions && (
              <div className="sm:col-span-2">
                <h3 className="mb-1 text-sm font-medium text-muted-foreground">Instructions</h3>
                <p className="whitespace-pre-wrap text-sm">{assessment.instructions}</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === "Problems" && <ProblemsTab assessmentId={id} />}
      {tab === "Invitations" && <InvitationsTab assessmentId={id} />}
      {tab === "Results" && <ResultsTab assessmentId={id} />}
    </>
  );
}

function ProblemsTab({ assessmentId }: { assessmentId: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-muted-foreground">
          Manage problems in the{" "}
          <Link href={`/recruiter/assessments/${assessmentId}/problems`} className="text-primary-600 hover:underline">
            problems editor
          </Link>
          .
        </p>
      </CardBody>
    </Card>
  );
}

function InvitationsTab({ assessmentId }: { assessmentId: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-muted-foreground">
          Invite candidates from the{" "}
          <Link href={`/recruiter/assessments/${assessmentId}/invitations`} className="text-primary-600 hover:underline">
            invitations page
          </Link>
          .
        </p>
      </CardBody>
    </Card>
  );
}

function ResultsTab({ assessmentId }: { assessmentId: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-muted-foreground">
          View the full{" "}
          <Link href={`/recruiter/assessments/${assessmentId}/report`} className="text-primary-600 hover:underline">
            assessment report
          </Link>
          .
        </p>
      </CardBody>
    </Card>
  );
}
