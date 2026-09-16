"use client";

import { useAdminCompanies } from "@/hooks/useAdmin";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { formatNumber, formatDateTime } from "@/lib/utils";
import type { Company } from "@/lib/types";

export default function AdminCompaniesPage() {
  const { data, isLoading } = useAdminCompanies({ limit: 100 });
  const companies = data?.data ?? [];

  return (
    <>
      <PageHeader title="Companies" subtitle="All registered companies and their credit balances" />
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <Spinner className="mx-auto my-10" />
          ) : companies.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No companies yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Industry</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Credits</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Members</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Assessments</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c: Company) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.website ?? c.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.industry ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNumber(c.credits)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c._count?.members ?? 0}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{c._count?.assessments ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.createdAt ? formatDateTime(c.createdAt) : "—"}
                    </td>
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
