"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell } from "@/components/layout/AppShell";
import { RECRUITER_NAV } from "@/lib/constants";

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="RECRUITER">
      <AppShell nav={RECRUITER_NAV}>{children}</AppShell>
    </RoleGuard>
  );
}
