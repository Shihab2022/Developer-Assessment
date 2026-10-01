"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand/Logo";
import { APP_NAME, dashboardPathForRole } from "@/lib/constants";
import { useCurrentUser } from "@/store/auth";
import type { ReactNode } from "react";

/**
 * Shared shell for the authentication screens: a centred card whose brand mark
 * (icon + name) always links home — or straight to the dashboard when a session
 * already exists.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const user = useCurrentUser();
  const homeHref = user ? dashboardPathForRole(user.role) : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950/40">
      <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>
        <div className="flex justify-center">
          <Link
            href={homeHref}
            aria-label={`${APP_NAME} home`}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <BrandMark className="size-9" />
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {APP_NAME}
            </span>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            {eyebrow}
            <h1 className="mt-2 text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>

        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  );
}

export default AuthShell;
