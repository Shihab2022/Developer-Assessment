"use client";

import { useAuditLogs } from "@/hooks/useAdmin";
import { useAdminUsers } from "@/hooks/useAdmin";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime } from "@/lib/utils";
import type { AuditLog } from "@/lib/types.platform";

export default function ModerationPage() {
  const { data: users, isLoading: usersLoading } = useAdminUsers({ limit: 100 });
  const { data: logs, isLoading: logsLoading } = useAuditLogs({ limit: 30 });

  const suspended = (users?.data ?? []).filter((u) => u.status === "SUSPENDED");
  const recent = (logs?.data ?? []) as AuditLog[];

  return (
    <>
      <PageHeader
        title="Moderation"
        subtitle="Suspended accounts and recent privileged activity"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={`Suspended users (${suspended.length})`} />
          <CardBody>
            {usersLoading ? (
              <Spinner className="mx-auto my-6" />
            ) : suspended.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No suspended accounts.
              </p>
            ) : (
              <div className="space-y-2">
                {suspended.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <CardBody>
            {logsLoading ? (
              <Spinner className="mx-auto my-6" />
            ) : recent.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {recent.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-baseline justify-between gap-3">
                    <span className="text-foreground">{log.action}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
