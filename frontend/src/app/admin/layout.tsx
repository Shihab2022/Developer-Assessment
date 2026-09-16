"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_NAV } from "@/lib/constants";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="ADMIN">
      <AppShell nav={ADMIN_NAV}>{children}</AppShell>
    </RoleGuard>
  );
}
