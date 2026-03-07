import { differenceInDays } from "date-fns";
import { PRIORITY_WEIGHTS, URGENCY_WEIGHTS } from "./constants";
import type { Expense, PriorityLevel, UrgencyLevel } from "./types";

function getDateProximityScore(dueDate: string | null): number {
  if (!dueDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const daysUntilDue = differenceInDays(due, today);

  if (daysUntilDue < 0) return 10; // overdue
  if (daysUntilDue <= 3) return 8;
  if (daysUntilDue <= 7) return 6;
  if (daysUntilDue <= 14) return 4;
  if (daysUntilDue <= 30) return 2;
  return 1; // > 30 days
}

export function calculatePriorityScore(expense: Expense): number {
  const priorityScore =
    PRIORITY_WEIGHTS[expense.priority as PriorityLevel] * 3;
  const urgencyScore =
    URGENCY_WEIGHTS[expense.urgency as UrgencyLevel] * 2;
  const dateScore = getDateProximityScore(expense.due_date);

  return priorityScore + urgencyScore + dateScore;
}

export function sortByPriority(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const scoreA = calculatePriorityScore(a);
    const scoreB = calculatePriorityScore(b);

    // Higher score = higher priority
    if (scoreB !== scoreA) return scoreB - scoreA;

    // Tiebreaker 1: Earlier due date first
    if (a.due_date && b.due_date) {
      const dateCompare =
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (dateCompare !== 0) return dateCompare;
    }
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;

    // Tiebreaker 2: Higher amount first
    if (b.amount !== a.amount) return b.amount - a.amount;

    // Tiebreaker 3: Oldest creation first
    return (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });
}
