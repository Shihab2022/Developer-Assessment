"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ClipboardList,
  Coins,
  CreditCard,
  History,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  LogOut,
  Mail,
  Menu,
  PenLine,
  ScrollText,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { NavItem } from "@/lib/constants";
import { useAuthStore } from "@/store/auth";
import api from "@/lib/api";
import { NotificationBell } from "./NotificationBell";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ClipboardList,
  Library,
  Users,
  PenLine,
  LayoutTemplate,
  Building2,
  Coins,
  Mail,
  History,
  CreditCard,
  ScrollText,
};

export function AppShell({
  nav,
  children,
}: {
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clear, refreshToken } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    try {
      await api.post("/auth/logout", { refreshToken });
    } catch {
      /* ignore */
    }
    clear();
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/recruiter/dashboard" && pathname.startsWith(href + "/"));

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 font-black text-white">
          D
        </div>
        <div>
          <p className="text-sm font-bold text-white">DevAssess</p>
          <p className="text-[11px] text-slate-500">Assessment Platform</p>
        </div>
      </div>
      <nav className="thin-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map((item) => {
          const Icon = ICONS[item.icon] ?? Landmark;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary-600/90 text-white"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-white",
              )}
            >
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800/80 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600/30 text-sm font-bold text-primary-300">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
          </div>
        </div>
        <div className="mt-1 space-y-1">
          <Link
            href="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-white"
          >
            <UserCircle className="h-4 w-4" /> Profile & Settings
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden text-xs text-slate-400 lg:block">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
