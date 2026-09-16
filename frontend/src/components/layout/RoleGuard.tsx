"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import type { Role } from "@/lib/types";
import { dashboardPathForRole } from "@/lib/constants";

interface RoleGuardProps {
  /** Roles that are allowed to render children. If undefined, any authed user passes. */
  allowedRoles?: Role[];
  children: React.ReactNode;
}

/**
 * Guards a route by role. While the session is hydrating it renders nothing;
 * once the persisted session is loaded it resolves the user and redirects:
 *  - no token  → /login
 *  - wrong role → the dashboard for their actual role
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, accessToken, hydrated } = useAuthStore(
    (s) => ({ user: s.user, accessToken: s.accessToken, hydrated: s.hydrated }),
  );
  const { data: me, isError } = useMe();

  const resolvedUser = user ?? me;

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken || isError) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && resolvedUser && !allowedRoles.includes(resolvedUser.role)) {
      router.replace(dashboardPathForRole(resolvedUser.role));
    }
  }, [hydrated, accessToken, resolvedUser, isError, router, allowedRoles]);

  if (!hydrated || !accessToken) return null;
  if (allowedRoles && resolvedUser && !allowedRoles.includes(resolvedUser.role)) return null;

  return <>{children}</>;
}

/** Convenience wrapper used inside layout files. */
export function RoleLayout({
  role,
  children,
}: {
  role: Role | Role[];
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={Array.isArray(role) ? role : [role]}>
      {children}
    </RoleGuard>
  );
}
