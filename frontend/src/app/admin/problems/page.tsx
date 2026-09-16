"use client";

import { useAdminProblems } from "@/hooks/useAdmin";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { DifficultyBadge, TypeBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import type { Problem } from "@/lib/types";

export default function AdminProblemsPage() {
  const { data, isLoading } = useAdminProblems({ limit: 100 });
  const problems = data?.data ?? [];

  return (
    <>
      <PageHeader title="Problems" subtitle="The shared problem library" />
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <Spinner className="mx-auto my-10" />
          ) : problems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No problems yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Problem</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Difficulty</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Points</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p: Problem) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{p.title}</td>
                    <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                    <td className="px-4 py-3"><DifficultyBadge difficulty={p.difficulty} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.points}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </>
  );
}
