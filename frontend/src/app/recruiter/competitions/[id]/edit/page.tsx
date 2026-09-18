"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Primitives";
import { CompetitionBuilder } from "@/components/competitions/CompetitionBuilder";
import {
  competitionById,
  useCompetitionsHydrated,
  useCompetitionsStore,
} from "@/store/competitions";

export default function EditCompetitionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const hydrated = useCompetitionsHydrated();
  const competitions = useCompetitionsStore((state) => state.competitions);

  const competition = useMemo(
    () => competitionById(competitions, params.id),
    [competitions, params.id],
  );

  if (!hydrated) {
    return <Spinner className="mx-auto my-12" />;
  }

  if (!competition) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          This competition no longer exists. It may have been deleted.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Go back
          </Button>
          <Button size="sm" asChild>
            <Link href="/recruiter/competitions">
              <Copy className="size-4" />
              All competitions
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/recruiter/competitions/${competition.id}`}>
          <ArrowLeft className="size-4" />
          Back to dashboard
          <Pencil className="hidden" />
        </Link>
      </Button>
      <CompetitionBuilder competition={competition} />
    </div>
  );
}
