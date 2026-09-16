"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import type { Assessment } from "@/lib/types";
import { AssessmentForm } from "@/components/assessments/AssessmentForm";
import { PageHeader } from "@/components/ui/Card";
import { LoadingBlock, EmptyState } from "@/components/ui/Misc";

export default function EditAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/assessments/${id}`)
      .then((res) => setAssessment(res.data?.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingBlock />;
  if (!assessment) return <EmptyState title="Assessment not found" />;

  const editable = assessment.status === "DRAFT" || assessment.status === "PUBLISHED";

  if (!editable) {
    return (
      <EmptyState
        title="This assessment can no longer be edited"
        description={`Assessments can be edited in DRAFT or PUBLISHED status. Current status: ${assessment.status}.`}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit Assessment" subtitle={assessment.title} />
      <AssessmentForm
        initial={assessment}
        submitLabel="Save changes"
        onSubmit={async (body) => {
          try {
            await api.patch(`/assessments/${id}`, body);
            toast.success("Assessment updated");
            router.push(`/recruiter/assessments/${id}`);
          } catch (err) {
            toast.error(getErrorMessage(err));
            throw err;
          }
        }}
      />
    </div>
  );
}
