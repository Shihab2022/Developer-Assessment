"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Primitives";
import { OwnQuestionBank } from "@/components/competitions/OwnQuestionBank";
import { QuestionEditorModal } from "@/components/competitions/QuestionEditor";
import { useCompetitionsHydrated, useCompetitionsStore } from "@/store/competitions";
import type { OwnQuestion } from "@/lib/competitions/types";


export default function RecruiterQuestionsPage() {
  const hydrated = useCompetitionsHydrated();
  const ownQuestions = hydrated
    ? useCompetitionsStore((state) => state.ownQuestions)
    : [];
  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="Own question bank"
        subtitle="Questions you authored for competitions and exams."
      />

      <OwnQuestionBank />
    </div>
  );
}
