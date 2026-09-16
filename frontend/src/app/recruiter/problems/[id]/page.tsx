"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import type { Problem } from "@/lib/types";
import { ProblemForm } from "@/components/problems/ProblemForm";
import { PageHeader } from "@/components/ui/Card";
import { LoadingBlock, EmptyState } from "@/components/ui/Misc";

export default function EditProblemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/problems/${id}`)
      .then((res) => setProblem(res.data?.data))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingBlock />;
  if (!problem) return <EmptyState title="Problem not found" />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit Problem" subtitle={problem.title} />
      <ProblemForm
        initial={problem}
        submitLabel="Save changes"
        onSubmit={async (body) => {
          try {
            await api.patch(`/problems/${id}`, body);
            toast.success("Problem updated");
            router.push("/recruiter/problems");
          } catch (err) {
            toast.error(getErrorMessage(err));
            throw err;
          }
        }}
      />
    </div>
  );
}
