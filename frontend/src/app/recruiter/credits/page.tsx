"use client";

import { usePayments, usePaymentPackages, useInitiatePayment } from "@/hooks/usePayments";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CREDIT_USAGE_NOTE } from "@/lib/constants";

export default function CreditsPage() {
  const packages = usePaymentPackages();
  const payments = usePayments({ limit: 20 });
  const initiate = useInitiatePayment();

  const history = payments.data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Credits & billing"
        subtitle="Top up your company credit balance to invite candidates"
      />
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">{CREDIT_USAGE_NOTE}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.isLoading ? (
          <Spinner className="mx-auto my-8" />
        ) : (
          (packages.data ?? []).map((pkg) => (
            <Card key={pkg.id}>
              <CardBody className="flex h-full flex-col justify-between gap-4">
                <div>
                  <h3 className="font-medium text-foreground">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
                  )}
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {formatCurrency(pkg.price)}
                  </p>
                  <p className="text-sm text-muted-foreground">{pkg.credits} credits</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => initiate.mutate({ packageId: pkg.id })}
                  disabled={initiate.isPending}
                >
                  {initiate.isPending ? "Redirecting…" : "Buy package"}
                </Button>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <Card className="mt-8">
        <CardHeader title="Payment history" />
        <CardBody className="p-0">
          {payments.isLoading ? (
            <Spinner className="mx-auto my-8" />
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(p.createdAt ?? "")}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
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
