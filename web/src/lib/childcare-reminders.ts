/**
 * Child-care reminder definitions.
 *
 * HOW TO ADD MORE REMINDERS:
 *   1. Add a new object to the array below.
 *   2. Set frequency to "daily" (shown every visit) or "weekly" (shown once a week with a soft highlight).
 *   3. Pick any icon name from lucide-react (see https://lucide.dev/icons).
 *   4. Optionally add a `tip` for extra guidance.
 *
 * The UI component reads this array automatically — no UI changes needed.
 */

export type ReminderFrequency = "daily" | "weekly";

export interface CareReminder {
  id: string;
  frequency: ReminderFrequency;
  /** lucide-react icon name (PascalCase) */
  icon: string;
  label: string;
  tip?: string;
}

export const CHILDCARE_REMINDERS: CareReminder[] = [
  // ─── Daily reminders ────────────────────────────────────────────────────────
  {
    id: "boil-bottles",
    frequency: "daily",
    icon: "FlameKindling",
    label: "Boil & sterilize feeding bottles",
    tip: "Boil for at least 5 minutes or use a steam sterilizer.",
  },
  {
    id: "gum-teeth",
    frequency: "daily",
    icon: "Smile",
    label: "Clean gums / sanitize teeth",
    tip: "Use a soft damp cloth for gums; a finger-brush once teeth appear.",
  },
  {
    id: "diaper-check",
    frequency: "daily",
    icon: "Baby",
    label: "Check & change diapers regularly",
    tip: "Inspect for rashes and keep skin dry.",
  },
  {
    id: "tummy-time",
    frequency: "daily",
    icon: "Activity",
    label: "Tummy time (2–3 sessions)",
    tip: "3–5 min per session helps strengthen neck and shoulder muscles.",
  },

  // ─── Weekly reminders ───────────────────────────────────────────────────────
  {
    id: "trim-nails",
    frequency: "weekly",
    icon: "Scissors",
    label: "Trim baby's nails",
    tip: "Use baby nail clippers after a bath when nails are soft.",
  },
  {
    id: "bath-routine",
    frequency: "weekly",
    icon: "Droplets",
    label: "Gentle sponge / full bath",
    tip: "2–3 times a week is sufficient for newborns.",
  },
  {
    id: "baby-massage",
    frequency: "weekly",
    icon: "Heart",
    label: "Baby massage",
    tip: "Warm coconut or mustard oil massage supports bonding and sleep.",
  },
];
