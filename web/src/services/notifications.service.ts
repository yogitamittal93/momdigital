import { api } from "@/lib/api-client";

export interface AppNotification {
  id: string;
  type: "SCAN_QUEUED" | "SCAN_REVIEWED" | "CHAT_QUEUED" | "CHAT_ANSWERED";
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export async function getNotifications(): Promise<AppNotification[]> {
  const data = await api.get("/notifications");
  return Array.isArray(data)
    ? (data as AppNotification[])
    : ((data as { data?: AppNotification[] })?.data ?? []);
}

export async function getUnreadCount(): Promise<number> {
  const data = (await api.get("/notifications/unread-count")) as {
    count: number;
  };
  return data?.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/read-all", {});
}
