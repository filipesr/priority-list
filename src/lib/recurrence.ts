import type { RecurrenceFrequency } from "@/lib/types";

/**
 * Returns the NEXT period's due date as YYYY-MM-DD string,
 * advancing from the given currentDueDate.
 */
export function computeNextDueDate(
  frequency: RecurrenceFrequency | null,
  currentDueDate: string | null,
): string | null {
  if (!frequency || !currentDueDate) return null;

  const base = new Date(currentDueDate + "T00:00:00");
  const day = base.getDate();

  if (frequency === "monthly") {
    const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, daysInMonth));
    return formatDateISO(next);
  }
  if (frequency === "yearly") {
    const next = new Date(base.getFullYear() + 1, base.getMonth(), 1);
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, daysInMonth));
    return formatDateISO(next);
  }
  // weekly
  const next = new Date(base);
  next.setDate(next.getDate() + 7);
  return formatDateISO(next);
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
