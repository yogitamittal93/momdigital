"use client";

import {
  Baby,
  Activity,
  Smile,
  Scissors,
  Droplets,
  Heart,
  FlameKindling,
  Bell,
  CalendarCheck,
  type LucideProps,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CHILDCARE_REMINDERS, type CareReminder } from "@/lib/childcare-reminders";

// ── Icon resolver ─────────────────────────────────────────────────────────────
// Add new imports above and a mapping entry here if you add new icon names.
type IconComponent = React.FC<LucideProps>;

const ICON_MAP: Record<string, IconComponent> = {
  Baby,
  Activity,
  Smile,
  Scissors,
  Droplets,
  Heart,
  FlameKindling,
  Bell,
  CalendarCheck,
};

function ReminderIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Bell;
  return <Icon className={className} />;
}

// ── Single reminder row ───────────────────────────────────────────────────────
function ReminderRow({ reminder, weekly }: { reminder: CareReminder; weekly?: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl transition-colors ${
        weekly
          ? "bg-chart-4/15 border border-chart-4/30"
          : "bg-muted/30"
      }`}
    >
      <span
        className={`flex-shrink-0 mt-0.5 ${
          weekly ? "text-chart-4" : "text-primary"
        }`}
      >
        <ReminderIcon name={reminder.icon} className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-snug">{reminder.label}</p>
        {reminder.tip && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {reminder.tip}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────
export default function ChildCareReminders() {
  const daily = CHILDCARE_REMINDERS.filter((r) => r.frequency === "daily");
  const weekly = CHILDCARE_REMINDERS.filter((r) => r.frequency === "weekly");

  return (
    <Card className="rounded-3xl border-none shadow-lg p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" />
        <h3 className="text-base">Care Reminders</h3>
      </div>

      {/* Daily section */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Daily
          </span>
        </div>
        <div className="space-y-2">
          {daily.map((r) => (
            <ReminderRow key={r.id} reminder={r} />
          ))}
        </div>
      </div>

      {/* Weekly section */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <CalendarCheck className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Weekly
          </span>
        </div>
        <div className="space-y-2">
          {weekly.map((r) => (
            <ReminderRow key={r.id} reminder={r} weekly />
          ))}
        </div>
      </div>
    </Card>
  );
}
