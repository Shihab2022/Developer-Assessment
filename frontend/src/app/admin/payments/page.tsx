"use client";

import { useAdminPayments } from "@/hooks/useAdmin";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Payment } from "@/lib/types.platform";

export default function AdminPaymentsPage() {
  const { data, isLoading } = useAdminPayments({ limit: 100 });
  const payments = data?.data ?? [];

  const total = payments
    .filter((p: Payment) => p.status === "PAID")
    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle={payments.length ? `${payments.length} transactions · ${formatCurrency(total)} collected` : "All credit purchases"}
      />
      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <Spinner className="mx-auto my-10" />
          ) : payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Package</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Gateway</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: Payment) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.createdAt ? formatDateTime(p.createdAt) : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.company?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.package ? `${p.package.name} (${p.package.credits} credits)` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{p.gateway}</td>
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
