"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Expense } from "@/lib/types";

export interface DashboardStats {
  totalPending: number;
  totalInProgress: number;
  totalCompletedMonth: number;
  budgetLimit: number | null;
}

export interface CategoryBreakdown {
  category: string;
  label: string;
  total: number;
  count: number;
  color: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

export async function getDashboardStats(): Promise<
  ActionResult<DashboardStats>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endOfMonth = new Date(currentYear, currentMonth, 0)
    .toISOString()
    .split("T")[0];

  // Get pending expenses total
  const { data: pending } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", user.id)
    .eq("status", "pending");

  // Get in_progress expenses total
  const { data: inProgress } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", user.id)
    .eq("status", "in_progress");

  // Get completed this month
  const { data: completedMonth } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .gte("completed_at", startOfMonth)
    .lte("completed_at", `${endOfMonth}T23:59:59`);

  // Get budget for current month
  const { data: budget } = await supabase
    .from("budgets")
    .select("total_limit")
    .eq("user_id", user.id)
    .eq("month", currentMonth)
    .eq("year", currentYear)
    .single();

  const sumAmounts = (items: { amount: number }[] | null) =>
    items?.reduce((sum, item) => sum + Number(item.amount), 0) ?? 0;

  return {
    success: true,
    data: {
      totalPending: sumAmounts(pending),
      totalInProgress: sumAmounts(inProgress),
      totalCompletedMonth: sumAmounts(completedMonth),
      budgetLimit: budget?.total_limit ? Number(budget.total_limit) : null,
    },
  };
}

export async function getCategoryBreakdown(): Promise<
  ActionResult<CategoryBreakdown[]>
> {
  const { CATEGORY_LABELS, CATEGORY_COLORS } = await import(
    "@/lib/constants"
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select("category, amount")
    .eq("user_id", user.id)
    .neq("status", "completed");

  if (!expenses) {
    return { success: true, data: [] };
  }

  const breakdown = new Map<
    string,
    { total: number; count: number }
  >();

  for (const expense of expenses) {
    const current = breakdown.get(expense.category) ?? {
      total: 0,
      count: 0,
    };
    current.total += Number(expense.amount);
    current.count += 1;
    breakdown.set(expense.category, current);
  }

  const result: CategoryBreakdown[] = Array.from(breakdown.entries()).map(
    ([category, { total, count }]) => ({
      category,
      label:
        CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category,
      total,
      count,
      color:
        CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? "#6b7280",
    })
  );

  return { success: true, data: result };
}

export async function getMonthlySpending(): Promise<
  ActionResult<MonthlySpending[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const months: MonthlySpending[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().split("T")[0];

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .gte("completed_at", start)
      .lte("completed_at", `${end}T23:59:59`);

    const total =
      expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

    const monthLabel = date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });

    months.push({ month: monthLabel, total });
  }

  return { success: true, data: months };
}

export async function getPriorityListExpenses(): Promise<
  ActionResult<Expense[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Erro ao buscar despesas" };
  }

  return { success: true, data: data ?? [] };
}
