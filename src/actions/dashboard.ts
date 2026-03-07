"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Expense, SupportedCurrency } from "@/lib/types";
import { getLatestRates } from "@/actions/exchange-rates";
import { convertAmount } from "@/lib/currency";
import type { RateMap } from "@/lib/currency";

export interface DashboardStats {
  totalPending: number;
  totalInProgress: number;
  totalCompletedMonth: number;
  totalIncomeMonth: number;
  preferredCurrency: SupportedCurrency;
}

export interface CategoryBreakdown {
  category: string;
  label: string;
  total: number;
  count: number;
  color: string;
}

export interface CostCenterBreakdown {
  costCenter: string;
  label: string;
  total: number;
  count: number;
  color: string;
}

export interface MonthlySpending {
  month: string;
  total: number;
}

function sumConverted(
  items: { amount: number; currency?: string }[] | null,
  target: SupportedCurrency,
  rates: RateMap
): number {
  if (!items) return 0;
  return items.reduce(
    (sum, item) =>
      sum +
      convertAmount(
        Number(item.amount),
        (item.currency as SupportedCurrency) || "BRL",
        target,
        rates
      ),
    0
  );
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;
  const rates = await getLatestRates();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const endOfMonth = new Date(currentYear, currentMonth, 0)
    .toISOString()
    .split("T")[0];

  const { data: pending } = await supabase
    .from("expenses")
    .select("amount, currency")
    .eq("status", "pending");

  const { data: inProgress } = await supabase
    .from("expenses")
    .select("amount, currency")
    .eq("status", "in_progress");

  const { data: completedMonth } = await supabase
    .from("expenses")
    .select("amount, currency")
    .eq("status", "completed")
    .gte("completed_at", startOfMonth)
    .lte("completed_at", `${endOfMonth}T23:59:59`);

  // Get incomes total
  const { data: incomes } = await supabase
    .from("incomes")
    .select("amount, currency");

  return {
    success: true,
    data: {
      totalPending: sumConverted(pending, preferredCurrency, rates),
      totalInProgress: sumConverted(inProgress, preferredCurrency, rates),
      totalCompletedMonth: sumConverted(completedMonth, preferredCurrency, rates),
      totalIncomeMonth: sumConverted(incomes, preferredCurrency, rates),
      preferredCurrency,
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;
  const rates = await getLatestRates();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("category, amount, currency")
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
    current.total += convertAmount(
      Number(expense.amount),
      (expense.currency as SupportedCurrency) || "BRL",
      preferredCurrency,
      rates
    );
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

export async function getCostCenterBreakdown(): Promise<
  ActionResult<CostCenterBreakdown[]>
> {
  const { COST_CENTER_LABELS, COST_CENTER_COLORS } = await import(
    "@/lib/constants"
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;
  const rates = await getLatestRates();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("cost_center, amount, currency")
    .neq("status", "completed");

  if (!expenses) {
    return { success: true, data: [] };
  }

  const breakdown = new Map<
    string,
    { total: number; count: number }
  >();

  for (const expense of expenses) {
    const cc = expense.cost_center ?? "outros";
    const current = breakdown.get(cc) ?? { total: 0, count: 0 };
    current.total += convertAmount(
      Number(expense.amount),
      (expense.currency as SupportedCurrency) || "BRL",
      preferredCurrency,
      rates
    );
    current.count += 1;
    breakdown.set(cc, current);
  }

  const result: CostCenterBreakdown[] = Array.from(breakdown.entries()).map(
    ([costCenter, { total, count }]) => ({
      costCenter,
      label:
        COST_CENTER_LABELS[costCenter as keyof typeof COST_CENTER_LABELS] ?? costCenter,
      total,
      count,
      color:
        COST_CENTER_COLORS[costCenter as keyof typeof COST_CENTER_COLORS] ?? "#6b7280",
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;
  const rates = await getLatestRates();

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
      .select("amount, currency")
      .eq("status", "completed")
      .gte("completed_at", start)
      .lte("completed_at", `${end}T23:59:59`);

    const total = sumConverted(expenses, preferredCurrency, rates);

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
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPriorityListExpenses error:", error.message, error.code);
    return { success: false, error: `Erro ao buscar despesas: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}
