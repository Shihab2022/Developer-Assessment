"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Bell } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { NOTIFICATION_ICONS } from "@/lib/constants";
import type { AppNotification } from "@/lib/types";
import { EmptyState } from "@/components/ui/Misc";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const load = () => {
    api
      .get("/notifications", { params: { page: 1, limit: 6 } })
      .then((res) => setItems(res.data?.data ?? []))
      .catch(() => {});
    api
      .get("/notifications/unread-count")
      .then((res) => setUnread(res.data?.data?.unreadCount ?? 0))
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markRead = async (n: AppNotification) => {
    if (n.status === "READ") return;
    try {
      await api.patch(`/notifications/${n.id}/read`);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, status: "READ" } : x)));
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <Link href="/notifications" className="text-xs font-medium text-primary-600 hover:underline" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          <div className="thin-scrollbar max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <EmptyState title="No notifications yet" className="py-8" />
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={cn(
                    "flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50",
                    n.status === "UNREAD" && "bg-primary-50/40",
                  )}
                >
                  <span className="text-lg leading-none">{NOTIFICATION_ICONS[n.type] ?? "🔔"}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{n.title}</span>
                    <span className="line-clamp-2 block text-xs text-slate-500">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                  </span>
                  {n.status === "UNREAD" && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
