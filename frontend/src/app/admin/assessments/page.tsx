"use client";

import Link from "next/link";
import { useAdminAssessments } from "@/hooks/useAdmin";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime } from "@/lib/utils";
import type { Assessment } from "@/lib/types";

export default function AdminAssessmentsPage() {
  const { data, isLoading } = useAdminAssessments({ limit: 100 });
  const assessments = data?.data ?? [];

  return (
    <>
      <PageHeader title="Assessments" subtitle="Every assessment across all companies" />
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <Spinner className="mx-auto my-10" />
          ) : assessments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No assessments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Assessment</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Problems</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Invitations</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a: Assessment) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{a.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.company?.name ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{a._count?.problems ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{a._count?.invitations ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.createdAt ? formatDateTime(a.createdAt) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Manage individual assessments from your{" "}
        <Link href="/recruiter/assessments" className="text-primary-600 hover:underline">
          recruiter view
        </Link>
        .
      </p>
    </>
  );
}
