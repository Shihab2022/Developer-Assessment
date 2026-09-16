"use client";

import { useAuditLogs } from "@/hooks/useAdmin";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/Primitives";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/types.platform";

export default function SecurityPage() {
  const { data, isLoading } = useAuditLogs({ limit: 100 });

  // Suspicious signals the platform records: privileged actions from new IPs.
  const logs = (data?.data ?? []) as AuditLog[];
  const byIp = new Map<string, number>();
  logs.forEach((l) => {
    if (l.ipAddress) byIp.set(l.ipAddress, (byIp.get(l.ipAddress) ?? 0) + 1);
  });
  const uniqueIps = Array.from(byIp.keys());

  return (
    <>
      <PageHeader
        title="Security"
        subtitle="Access signals for privileged actions"
      />
      <Alert className="mb-4">
        <AlertTitle>Anti-cheating telemetry</AlertTitle>
        <AlertDescription>
          Per-attempt proctoring events (tab switches, copy/paste, full-screen exits) live on each
          attempt under anti-cheating report endpoints; this page surfaces account-level signals.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader title={`Observed IP addresses (${uniqueIps.length})`} />
        <CardBody>
          {isLoading ? (
            <Spinner className="mx-auto my-6" />
          ) : uniqueIps.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No IP telemetry recorded yet.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {uniqueIps.map((ip) => (
                <div key={ip} className="flex items-center justify-between">
                  <span className="font-mono text-foreground">{ip}</span>
                  <span className="text-xs text-muted-foreground">
                    {byIp.get(ip)} action{byIp.get(ip) === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Latest audit entries" />
        <CardBody>
          {logs.slice(0, 15).map((log) => (
            <div
              key={log.id}
              className="flex items-baseline justify-between gap-3 border-b border-border py-2 text-sm last:border-0"
            >
              <span className="text-foreground">{log.action}</span>
              <span className="font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  );
}
