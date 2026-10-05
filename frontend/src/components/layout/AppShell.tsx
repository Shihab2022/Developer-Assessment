"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ClipboardList, Users, Building2, Library,
  FileText, BarChart3, Trophy, History, Mail, Terminal, PenLine,
  Coins, CreditCard, ShieldCheck, Lock, ScrollText, Menu,
  LogOut, User as UserIcon, Video, Home,
} from "lucide-react";
import { useLogout } from "@/hooks/useAuth";
import { useRecruiterDashboard, useCandidateDashboard } from "@/hooks/useDashboard";
import { useUiStore } from "@/store/ui";
import { useCurrentUser } from "@/store/auth";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BrandLogo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  navForRole,
  isNavActive,
  dashboardPathForRole,
  ROLE_LABELS,
  ROLE_TONES,
  type NavItem,
} from "@/lib/constants";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ClipboardList, Users, Building2, Library,
  FileText, BarChart3, Trophy, History, Mail, Terminal, PenLine,
  Coins, CreditCard, ShieldCheck, Lock, ScrollText, Video,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore(
    (s) => ({ sidebarOpen: s.sidebarOpen, toggleSidebar: s.toggleSidebar, setSidebarOpen: s.setSidebarOpen }),
  );
  const logout = useLogout();
  // Hooks must run before any early return so the hook order never changes.
  const recruiterDash = useRecruiterDashboard();
  const candidateDash = useCandidateDashboard();

  if (!user) return null;

  const nav = navForRole(user.role);
  const primaryNav = nav.filter((n) => !n.secondary);
  const secondaryNav = nav.filter((n) => n.secondary);

  const badgeFor = (badgeType?: string): number | undefined => {
    if (!badgeType) return undefined;
    if (badgeType === "pendingInvitations") {
      const summary = user.role === "CANDIDATE"
        ? candidateDash.data?.summary
        : recruiterDash.data?.summary;
      return summary?.pendingInvitations;
    }
    if (badgeType === "pendingEvaluations") {
      return recruiterDash.data?.summary?.pendingEvaluations;
    }
    return undefined;
  };

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col overflow-y-auto border-r border-border bg-card transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <BrandLogo size="sm" href={dashboardPathForRole(user.role)} />
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            ×
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2 thin-scrollbar overflow-y-auto">
          {primaryNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} badge={badgeFor(item.badge)} />
          ))}
          {secondaryNav.length > 0 && (
            <>
              <div className="my-2 border-t border-border" />
              {secondaryNav.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} badge={badgeFor(item.badge)} secondary />
              ))}
            </>
          )}
        </nav>
        <div className="space-y-1 border-t border-border p-2">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Home className="size-4 shrink-0" />
            <span>Home</span>
          </Link>
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={toggleSidebar}>
              <Menu className="size-4" />
            </Button>
            <h1 className="font-semibold text-foreground">
              {nav.find((n) => isNavActive(pathname, n.href))?.label ?? "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={ROLE_TONES[user.role]} size="sm" className="hidden sm:inline-flex">
              {ROLE_LABELS[user.role]}
            </Badge>
            <NotificationBell />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="h-9 px-2 sm:px-3"
              aria-label="Go to home page"
              title="Home"
            >
              <Home className="size-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logout.isPending}
              className="h-9 px-2 sm:px-3"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push(dashboardPathForRole(user.role))} className="h-9 w-9 rounded-full p-0" aria-label="Go to dashboard">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <UserIcon className="size-5" />
              )}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto thin-scrollbar">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ item, pathname, badge, secondary }: {
  item: NavItem;
  pathname: string;
  badge?: number;
  secondary?: boolean;
}) {
  const Icon = ICON_MAP[item.icon] ?? FileText;
  const active = isNavActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      className={cn(
        "nav-link",
        active
          ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        secondary && "text-sm opacity-75",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {badge}
        </span>
      )}
    </Link>
  );
}
