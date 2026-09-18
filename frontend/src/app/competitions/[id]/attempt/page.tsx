"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Primitives";
import { ExamShell } from "@/components/exams/ExamShell";
import { CompetitionAttempt } from "@/components/competitions/CompetitionAttempt";

export default function CompetitionAttemptPage({ params }: { params: { id: string } }) {
  return (
    <ExamShell>
      <Suspense fallback={<Spinner className="mx-auto my-12" />}>
        <AttemptFromQuery competitionId={params.id} />
      </Suspense>
    </ExamShell>
  );
}

function AttemptFromQuery({ competitionId }: { competitionId: string }) {
  const search = useSearchParams();
  const identity = {
    name: search.get("name") ?? "",
    email: search.get("email") ?? "",
    org: search.get("org") ?? "",
    code: search.get("code") ?? "",
  };

  if (!identity.name.trim()) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Tell us who you are on the competition page first — the attempt needs a
          name for the leaderboard.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link href={`/competitions/${competitionId}`}>
            <ArrowLeft className="size-4" />
            Back to the competition
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10">
      <CompetitionAttempt competitionId={competitionId} identity={identity} />
    </div>
  );
}

