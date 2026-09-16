"use client";

import { useState } from "react";
import { Bell, BellDot } from "lucide-react";
import { useNotifications, useUnreadNotificationCount, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalContent, ModalHeader } from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useNotifications({ limit: 10 });
  const { data: unreadData } = useUnreadNotificationCount(open);
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn("relative h-9 w-9 rounded-lg p-0", className)}
        aria-label="Notifications"
        onClick={() => setOpen(true)}
      >
        {unreadCount > 0 ? (
          <Bell className="size-4" />
        ) : (
          <BellDot className="size-4 text-muted-foreground" />
        )}
        {unreadCount > 0 && (
          <Badge
            tone="red"
            size="sm"
            className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full px-1"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="sm" showClose={false} className="p-0">
          <ModalHeader>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </ModalHeader>
          <div className="max-h-80 overflow-y-auto thin-scrollbar">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications?.data.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications?.data.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 p-4 hover:bg-muted/50",
                      n.status === "UNREAD" && "bg-primary-50/60 dark:bg-primary-950/30",
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
