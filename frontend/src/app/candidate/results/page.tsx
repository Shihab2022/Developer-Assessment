"use client";

import { useMyResults } from "@/hooks/useCandidate";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { PassedBadge } from "@/components/ui/Badge";
import { Progress, Spinner } from "@/components/ui/Primitives";
import { formatDateTime, formatPercent } from "@/lib/utils";
import type { Result } from "@/lib/types.platform";

export default function CandidateResultsPage() {
  const { data, isLoading } = useMyResults({ limit: 50 });
  const results = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="My results"
        subtitle="Only results released by the company are shown"
      />
      {isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : results.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            No released results yet.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((r: Result) => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {r.assessment?.title ?? "Assessment"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {r.releasedAt
                        ? `Released ${formatDateTime(r.releasedAt)}`
                        : r.createdAt
                          ? `Completed ${formatDateTime(r.createdAt)}`
                          : ""}
                    </p>
                  </div>
                  <PassedBadge passed={r.passed} />
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {r.earnedPoints} / {r.totalPoints} points
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatPercent(r.percentage)}
                    </span>
                  </div>
                  <Progress value={r.percentage} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
