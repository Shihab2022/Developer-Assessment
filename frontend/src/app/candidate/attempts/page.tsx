"use client";

import Link from "next/link";
import { useMyAttempts } from "@/hooks/useAttempts";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime } from "@/lib/utils";

export default function CandidateAttemptsPage() {
  const { data, isLoading } = useMyAttempts({ limit: 50 });
  const attempts = data?.data ?? [];

  return (
    <>
      <PageHeader title="My attempts" subtitle="Every attempt you have started" />
      {isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : attempts.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            No attempts yet. Accept an invitation and start an assessment.
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assessment</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Attempt</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Started</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {a.assessment?.title ?? "Assessment"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">#{a.attemptNumber}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.startedAt ? formatDateTime(a.startedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {a.score != null ? `${a.score}${a.maxScore ? ` / ${a.maxScore}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "IN_PROGRESS" ? (
                        <Button size="sm" asChild>
                          <Link href={`/candidate/attempts/${a.id}`}>Resume</Link>
                        </Button>
                      ) : a.status !== "NOT_STARTED" ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/candidate/attempts/${a.id}`}>Review</Link>
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </>
  );
}
