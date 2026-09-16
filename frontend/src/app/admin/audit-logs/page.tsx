"use client";

import { useAuditLogs } from "@/hooks/useAdmin";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime, humanizeEnum } from "@/lib/utils";
import type { AuditLog } from "@/lib/types.platform";

export default function AuditLogsPage() {
  const { data, isLoading } = useAuditLogs({ limit: 100 });
  const logs = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Audit logs"
        subtitle="Every privileged action, in order"
      />
      <Card>
        <CardBody>
          {isLoading ? (
            <Spinner className="mx-auto my-10" />
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <div className="space-y-0">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border py-3 text-sm last:border-0"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </span>
                  <span className="font-medium text-foreground">
                    {humanizeEnum(log.action)}
                  </span>
                  {log.entityType && (
                    <span className="text-xs text-muted-foreground">
                      on {log.entityType.toLowerCase()}
                    </span>
                  )}
                  {log.actor?.name && (
                    <span className="text-xs text-muted-foreground">
                      by {log.actor.name}
                    </span>
                  )}
                  {log.ipAddress && (
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {log.ipAddress}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
