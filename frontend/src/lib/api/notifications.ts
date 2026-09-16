import { apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { AppNotification, MarkAllReadResult, UnreadCountResult } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { NotificationListParams } from "./payloads";

export const notificationsApi = {
  list: (params?: NotificationListParams) =>
    apiGetPaginated<AppNotification>(endpoints.notifications.list, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  unreadCount: () => apiGet<UnreadCountResult>(endpoints.notifications.unreadCount),

  markRead: (id: string) => apiPatch<AppNotification>(endpoints.notifications.read(id)),

  markAllRead: () => apiPost<MarkAllReadResult>(endpoints.notifications.readAll),
};

export default notificationsApi;