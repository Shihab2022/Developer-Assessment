"use client";

import { useState } from "react";
import { useAdminUsers, useUpdateUserStatus, useUpdateUserRole } from "@/hooks/useAdmin";
import { useDebouncedValue } from "@/hooks/useUi";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { SelectField } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Primitives";
import { formatDateTime } from "@/lib/utils";
import type { Role } from "@/lib/types";

const ROLES = ["CANDIDATE", "RECRUITER", "ADMIN"];

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);

  const { data, isLoading } = useAdminUsers({
    q: debouncedQ || undefined,
    role: role || undefined,
    limit: 50,
  });
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const users = data?.data ?? [];

  return (
    <>
      <PageHeader title="Users" subtitle="All platform users — manage roles and status" />
      <Card>
        <CardBody>
          <div className="mb-4 flex flex-wrap gap-3">
            <Input
              placeholder="Search users..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <SelectField
              placeholder="All roles"
              value={role}
              onValueChange={setRole}
              options={ROLES.map((r) => ({ value: r, label: r }))}
              className="w-40"
            />
          </div>

          {isLoading ? (
            <Spinner className="mx-auto my-10" />
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">User</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Role</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3">
                      <SelectField
                        value={u.role}
                        onValueChange={(v) =>
                          updateRole.mutate({
                            id: u.id,
                            payload: { role: v as Role },
                          })
                        }
                        options={ROLES.map((r) => ({ value: r, label: r }))}
                        className="w-36"
                      />
                    </td>
                    <td className="py-3"><StatusBadge status={u.status} /></td>
                    <td className="py-3 text-muted-foreground">
                      {u.createdAt ? formatDateTime(u.createdAt) : "—"}
                    </td>
                    <td className="py-3 text-right">
                      {u.status === "ACTIVE" ? (
                        <button
                          className="text-xs font-medium text-destructive hover:underline"
                          onClick={() =>
                            updateStatus.mutate({ id: u.id, payload: { status: "SUSPENDED" } })
                          }
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="text-xs font-medium text-primary-600 hover:underline"
                          onClick={() =>
                            updateStatus.mutate({ id: u.id, payload: { status: "ACTIVE" } })
                          }
                        >
                          Reactivate
                        </button>
                      )}
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
