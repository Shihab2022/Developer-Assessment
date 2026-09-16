"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { dashboardPathForRole } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { LoadingBlock } from "@/components/ui/Misc";

/**
 * Client-side role guard. Waits for zustand persist hydration, redirects
 * unauthenticated users to /login and wrong-role users to their dashboard.
 * Also refreshes the profile (keeps companyId fresh for recruiter pages).
 */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const { user, accessToken, hydrated, setUser } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(dashboardPathForRole(user.role));
      return;
    }
    // Refresh profile in background (non-blocking)
    api
      .get("/auth/me")
      .then((res) => {
        if (res.data?.data) setUser(res.data.data);
      })
      .catch(() => {
        /* token refresh interceptor handles expiry */
      });
  }, [hydrated, accessToken, user, role, router, setUser]);

  if (!hydrated || !accessToken || !user || user.role !== role) {
    return <LoadingBlock label="Checking your session…" className="min-h-screen" />;
  }

  return <>{children}</>;
}
