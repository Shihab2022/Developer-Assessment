"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Trash2, Shield, UserCheck } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { User, Meta } from "@/lib/types";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock, Pagination } from "@/components/ui/Misc";

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", { params: { page, limit: 10, q } });
      setItems(res.data?.data ?? []);
      setMeta(res.data?.meta ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, q]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (user: User, status: "ACTIVE" | "SUSPENDED") => {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const changeRole = async (user: User, role: "RECRUITER" | "CANDIDATE" | "ADMIN") => {
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role });
      toast.success(`Role updated to ${role}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingBlock />;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <PageHeader title="Users" subtitle="All platform users." actions={<Button size="sm" variant="outline"><UserCheck className="h-4 w-4" /></Button>} />
      <div className="mb-4 max-w-md">
        <Input placeholder="Search name or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      </div>
      <Card>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-medium">{u.name}</td>
                  <td className="px-5 py-3 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3"><StatusBadge status={u.role} /></td>
                  <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-5 py-3 space-x-1">
                    {u.role === "RECRUITER" ? (
                      <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={() => changeRole(u, "CANDIDATE")}>→ Candidate</button>
                    ) : u.role === "CANDIDATE" ? (
                      <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs" onClick={() => changeRole(u, "RECRUITER")}>→ Recruiter</button>
                    ) : null}
                    {u.status === "ACTIVE" ? (
                      <button className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-600" onClick={() => changeStatus(u, "SUSPENDED")}>Suspend</button>
                    ) : (
                      <button className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-600" onClick={() => changeStatus(u, "ACTIVE")}>Activate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
      {meta && items.length === 0 && !loading ? <EmptyState title="No users match" /> : <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />}
    </main>
  );
}
