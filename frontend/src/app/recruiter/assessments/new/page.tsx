"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { AssessmentForm } from "@/components/assessments/AssessmentForm";
import { PageHeader } from "@/components/ui/Card";

export default function NewAssessmentPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Create Assessment" subtitle="Configure a new assessment — add problems and invite candidates afterwards." />
      <AssessmentForm
        submitLabel="Create assessment"
        onSubmit={async (body) => {
          try {
            const res = await api.post("/assessments", body);
            toast.success("Assessment created as draft");
            router.push(`/recruiter/assessments/${res.data?.data?.id}`);
          } catch (err) {
            toast.error(getErrorMessage(err));
            throw err;
          }
        }}
      />
    </div>
  );
}
