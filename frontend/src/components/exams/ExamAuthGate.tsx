"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ExamShell } from "@/components/exams/ExamShell";
import { useMe } from "@/hooks/useAuth";
import { loginPathFor } from "@/lib/constants";
import { useAuthStore } from "@/store/auth";

/**
 * Sign-in gate for the technology exam routes.
 *
 * Exams write results against the signed-in user, so a visitor must be
 * authenticated before they can set up or sit a paper. While the persisted
 * session is hydrating we render a neutral spinner (so server and first client
 * render agree), then:
 *   - signed out → redirect to `/login?next=<current path>` so the user lands
 *     straight back on the exam they were trying to open;
 *   - signed in  → render the exam.
 *
 * The `/exams` index stays public — only the per-technology start/attempt/result
 * pages sit behind this gate (see `app/exams/[technology]/layout.tsx`).
 */
export function ExamAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  const { data: me, isError, isLoading } = useMe();

  const resolvedUser = user ?? me;

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      const next =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : pathname;
      router.replace(loginPathFor(next));
      return;
    }
    // Wait for /me to finish resolving before judging a token-less `user`.
    if (isLoading) return;
    if (isError || !resolvedUser) {
      router.replace(loginPathFor(pathname));
    }
  }, [hydrated, accessToken, resolvedUser, isError, isLoading, pathname, router]);

  // Signed out — or the token no longer resolves to a user — so the login page
  // takes over. While /me is still verifying, keep the neutral spinner so a
  // slow API never flashes either screen.
  if (!hydrated || isLoading) {
    return (
      <ExamShell>
        <div className="container max-w-2xl py-20 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Checking your session…</p>
        </div>
      </ExamShell>
    );
  }

  // Redirecting to sign-in — render nothing rather than flashing the exam setup.
  if (!accessToken || isError || !resolvedUser) return null;

  return <>{children}</>;
}

export default ExamAuthGate;
