"use client";

import { use } from "react";
import { useAssessment } from "@/hooks/useAssessments";
import { AssessmentForm } from "@/components/recruiter/AssessmentForm";
import { Spinner } from "@/components/ui/Primitives";

export default function EditAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: assessment, isLoading } = useAssessment(id);

  if (isLoading) return <Spinner className="mx-auto my-12" />;
  if (!assessment) return <p className="my-12 text-center text-muted-foreground">Assessment not found.</p>;

  return <AssessmentForm assessment={assessment} />;
}
