"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, notificationsApi } from "@/lib/api";
import type { NotificationListParams } from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: qk.notifications.list(params),
    queryFn: () => notificationsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

/** Badge counter — polled so the bell stays fresh without a websocket. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: () => notificationsApi.unreadCount(),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.all });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.all });
      toast.success(
        result?.updated
          ? `${result.updated} notification${result.updated === 1 ? "" : "s"} marked as read`
          : "All notifications marked as read",
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}