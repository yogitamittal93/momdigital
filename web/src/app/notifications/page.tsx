"use client";

import { useEffect } from "react";
import {
  Bell,
  CheckCheck,
  MessageCircle,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/use-notifications";
import type { AppNotification } from "@/services/notifications.service";

function notifIcon(type: AppNotification["type"]) {
  if (type === "SCAN_QUEUED" || type === "SCAN_REVIEWED")
    return (
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Stethoscope className="w-5 h-5 text-primary" />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
      <MessageCircle className="w-5 h-5 text-secondary-foreground" />
    </div>
  );
}

function notifBadgeLabel(type: AppNotification["type"]) {
  switch (type) {
    case "SCAN_QUEUED":
      return { label: "Scan Queued", color: "bg-blue-100 text-blue-700" };
    case "SCAN_REVIEWED":
      return { label: "Scan Reviewed", color: "bg-green-100 text-green-700" };
    case "CHAT_QUEUED":
      return { label: "Review Queued", color: "bg-amber-100 text-amber-700" };
    case "CHAT_ANSWERED":
      return { label: "Question Answered", color: "bg-purple-100 text-purple-700" };
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function NotificationsPage() {
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();

  // Auto-mark all as read when user opens the page
  useEffect(() => {
    if (!loading && unreadCount > 0) {
      void markAllRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-br from-primary/20 via-secondary/10 to-background px-4 md:px-8 pt-8 pb-8 rounded-b-[3rem]">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <ClipboardList className="w-6 h-6 text-primary" />
              <h1 className="text-2xl md:text-3xl">Notifications</h1>
              {unreadCount > 0 && (
                <span className="text-sm bg-red-500 text-white rounded-full px-2.5 py-0.5 font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              Updates from your doctors, scans, and AI assistant
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 md:px-8 mt-6 space-y-4">
          {/* Mark all read button */}
          {notifications.some((n) => !n.isRead) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-2"
                onClick={() => void markAllRead()}
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <Card className="rounded-3xl border-none shadow-lg p-12 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium mb-1">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                When a doctor reviews your scan or responds to your question,
                you will see it here.
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => {
                const badge = notifBadgeLabel(n.type);
                return (
                  <Card
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) void markRead(n.id);
                    }}
                    className={`rounded-2xl border-none shadow-sm p-4 flex gap-4 cursor-pointer transition-all hover:shadow-md ${
                      !n.isRead
                        ? "bg-primary/5 border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    {notifIcon(n.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-sm leading-snug ${
                              !n.isRead ? "font-semibold" : "font-medium"
                            }`}
                          >
                            {n.title}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge?.color}`}
                          >
                            {badge?.label}
                          </span>
                        </div>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1.5">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
