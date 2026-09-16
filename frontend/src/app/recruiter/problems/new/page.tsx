"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { ProblemForm } from "@/components/problems/ProblemForm";
import { PageHeader } from "@/components/ui/Card";

export default function NewProblemPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Create Problem" subtitle="Author an MCQ, coding challenge or written question." />
      <ProblemForm
        submitLabel="Create problem"
        onSubmit={async (body) => {
          try {
            const res = await api.post("/problems", body);
            toast.success("Problem created");
            router.push("/recruiter/problems");
            return res;
          } catch (err) {
            toast.error(getErrorMessage(err));
            throw err;
          }
        }}
      />
    </div>
  );
}
