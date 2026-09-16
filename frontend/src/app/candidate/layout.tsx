"use client";

import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell } from "@/components/layout/AppShell";
import { CANDIDATE_NAV } from "@/lib/constants";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="CANDIDATE">
      <AppShell nav={CANDIDATE_NAV}>{children}</AppShell>
    </RoleGuard>
  );
}

