export function getPregnancyWeek(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const today = new Date();
  const conceptionDate = new Date(due);
  conceptionDate.setDate(conceptionDate.getDate() - 280);

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor(
    (today.getTime() - conceptionDate.getTime()) / msPerWeek,
  );

  return Math.max(0, Math.min(42, weeksElapsed));
}

export function getTrimester(
  week: number,
): "first" | "second" | "third" {
  if (week <= 13) return "first";
  if (week <= 26) return "second";
  return "third";
}

export function getDaysUntilDue(dueDate: string | Date): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export function formatTrimesterLabel(week: number): string {
  const t = getTrimester(week);
  if (t === "first") return "First Trimester";
  if (t === "second") return "Second Trimester";
  return "Third Trimester";
}
