"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Code2, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { APP_NAME, dashboardPathForRole } from "@/lib/constants";
import { LANDING_NAV } from "@/lib/marketing";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/store/auth";

/**
 * Sticky marketing header.
 *
 * The nav is anchor-based because the landing page is a single document; the
 * action buttons adapt to the session so a signed-in visitor can jump straight
 * back to their role dashboard.
 */
export function SiteHeader() {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-xl"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${APP_NAME} home`}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-sky-500 text-white shadow-glow">
            <Code2 className="size-5" strokeWidth={2.2} />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Landing sections">
          {LANDING_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {user ? (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={dashboardPathForRole(user.role)}>
                <LayoutDashboard />
                Dashboard
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/register">
                  Get started
                  <ArrowRight />
                </Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="iconSm"
            className="lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-card lg:hidden">
          <div className="container space-y-1 py-4">
            {LANDING_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 pt-3">
              {user ? (
                <Button asChild className="flex-1">
                  <Link href={dashboardPathForRole(user.role)}>Go to dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/register">Get started</Link>
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default SiteHeader;