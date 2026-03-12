"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Expense, SupportedCurrency } from "@/lib/types";
import { getLatestRates } from "@/actions/exchange-rates";
import { convertAmount } from "@/lib/currency";
import type { RateMap } from "@/lib/currency";
import { getSelectedOrcamentoId } from "@/actions/orcamentos";

export interface DashboardPeriod {
  month: number;
  year: number;
}

export interface DashboardStats {
  totalPlanned: number;
  totalRealized: number;
  totalRecurring: number;
  totalUnexpected: number;
  budgetLimit: number | null;
  totalIncome: number;
  balanceCurrent: number;
  balanceFinal: number;
  preferredCurrency: SupportedCurrency;
}

export interface CategoryBreakdownV2 {
  category: string;
  label: string;
  color: string;
  planned: number;
  pending: number;
  realized: number;
}

export interface CostCenterBreakdownV2 {
  costCenter: string;
  label: string;
  color: string;
  planned: number;
  pending: number;
  realized: number;
}

export interface PriorityBreakdownV2 {
  priority: string;
  label: string;
  color: string;
  planned: number;
  pending: number;
  realized: number;
}

export interface DailyFlowPoint {
  day: number;
  label: string;
  planned: number;
  realized: number;
  pending: number;
}

export interface TopExpenseItem {
  name: string;
  planned: number;
  pending: number;
  realized: number;
}

export interface YearlyOverviewPoint {
  month: number;
  label: string;
  planned: number;
  realized: number;
  revenue: number;
  balance: number;
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

function conv(
  amount: number,
  currency: string | undefined,
  target: SupportedCurrency,
  rates: RateMap
): number {
  return convertAmount(
    Number(amount),
    (currency as SupportedCurrency) || "BRL",
    target,
    rates
  );
}

function getPeriodRange(period?: DashboardPeriod) {
  const now = new Date();
  const month = period?.month ?? now.getMonth() + 1;
  const year = period?.year ?? now.getFullYear();
  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const endOfMonth = new Date(year, month, 0).toISOString().split("T")[0];
  return { month, year, startOfMonth, endOfMonth };
}

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;
  const rates = await getLatestRates();
  const orcamentoId = await getSelectedOrcamentoId();

  if (!orcamentoId) return null;

  return { supabase, user, preferredCurrency, rates, orcamentoId };
}

export async function getDashboardStats(
  period?: DashboardPeriod
): Promise<ActionResult<DashboardStats>> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Não autenticado ou sem orçamento" };

  const { supabase, preferredCurrency, rates, orcamentoId } = ctx;
  const { startOfMonth, endOfMonth, month, year } = getPeriodRange(period);

  const [
    { data: pending },
    { data: inProgress },
    { data: completedMonth },
    { data: recurring },
    { data: unexpected },
    { data: incomes },
    { data: budget },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("amount, currency")
      .eq("orcamento_id", orcamentoId)
      .eq("status", "pending")
      .gte("due_date", startOfMonth)
      .lte("due_date", endOfMonth),
    supabase
      .from("expenses")
      .select("amount, executed_amount, currency")
      .eq("orcamento_id", orcamentoId)
      .eq("status", "in_progress")
      .gte("due_date", startOfMonth)
      .lte("due_date", endOfMonth),
    supabase
      .from("expenses")
      .select("amount, currency")
      .eq("orcamento_id", orcamentoId)
      .eq("status", "completed")
      .gte("completed_at", startOfMonth)
      .lte("completed_at", `${endOfMonth}T23:59:59`),
    supabase
      .from("expenses")
      .select("amount, currency")
      .eq("orcamento_id", orcamentoId)
      .eq("is_recurring", true)
      .neq("status", "completed")
      .gte("due_date", startOfMonth)
      .lte("due_date", endOfMonth),
    supabase
      .from("expenses")
      .select("amount, currency")
      .eq("orcamento_id", orcamentoId)
      .eq("type", "imprevisto")
      .gte("due_date", startOfMonth)
      .lte("due_date", endOfMonth),
    supabase
      .from("incomes")
      .select("amount, currency")
      .eq("orcamento_id", orcamentoId),
    supabase
      .from("budgets")
      .select("total_limit")
      .eq("orcamento_id", orcamentoId)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle(),
  ]);

  const totalPending = sumConverted(pending, preferredCurrency, rates);
  const totalCompleted = sumConverted(completedMonth, preferredCurrency, rates);

  let totalInProgressAmount = 0;
  let totalInProgressExecuted = 0;
  if (inProgress) {
    for (const item of inProgress) {
      totalInProgressAmount += conv(item.amount, item.currency, preferredCurrency, rates);
      totalInProgressExecuted += conv(item.executed_amount, item.currency, preferredCurrency, rates);
    }
  }

  const totalPlanned = totalPending + totalInProgressAmount + totalCompleted;
  const totalRealized = totalCompleted + totalInProgressExecuted;
  const inProgressRemainder = totalInProgressAmount - totalInProgressExecuted;
  const totalIncome = sumConverted(incomes, preferredCurrency, rates);
  const balanceCurrent = totalIncome - totalRealized - inProgressRemainder;
  const balanceFinal = totalIncome - totalPlanned;

  return {
    success: true,
    data: {
      totalPlanned,
      totalRealized,
      totalRecurring: sumConverted(recurring, preferredCurrency, rates),
      totalUnexpected: sumConverted(unexpected, preferredCurrency, rates),
      budgetLimit: budget?.total_limit ?? null,
      totalIncome,
      balanceCurrent,
      balanceFinal,
      preferredCurrency,
    },
  };
}

type BreakdownAccum = {
  planned: number;
  pending: number;
  realized: number;
};

function computeBreakdown(
  expenses: { amount: number; executed_amount: number; currency: string; status: string }[],
  groupKey: (e: { amount: number; executed_amount: number; currency: string; status: string }) => string,
  preferredCurrency: SupportedCurrency,
  rates: RateMap
): Map<string, BreakdownAccum> {
  const map = new Map<string, BreakdownAccum>();

  for (const e of expenses) {
    const key = groupKey(e);
    const current = map.get(key) ?? { planned: 0, pending: 0, realized: 0 };
    const amount = conv(e.amount, e.currency, preferredCurrency, rates);
    const executed = conv(e.executed_amount, e.currency, preferredCurrency, rates);

    current.planned += amount;

    if (e.status === "pending") {
      current.pending += amount;
    } else if (e.status === "in_progress") {
      current.pending += amount - executed;
      current.realized += executed;
    } else if (e.status === "completed") {
      current.realized += amount;
    }

    map.set(key, current);
  }

  return map;
}

export async function getCategoryBreakdown(
  period?: DashboardPeriod
): Promise<ActionResult<CategoryBreakdownV2[]>> {
  const { CATEGORY_LABELS, CATEGORY_COLORS } = await import("@/lib/constants");

  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Não autenticado ou sem orçamento" };

  const { supabase, preferredCurrency, rates, orcamentoId } = ctx;

  let query = supabase
    .from("expenses")
    .select("category, amount, executed_amount, currency, status")
    .eq("orcamento_id", orcamentoId);

  if (period) {
    const { startOfMonth, endOfMonth } = getPeriodRange(period);
    query = query.gte("due_date", startOfMonth).lte("due_date", endOfMonth);
  }

  const { data: expenses } = await query;
  if (!expenses || expenses.length === 0) {
    return { success: true, data: [] };
  }

  const breakdown = computeBreakdown(
    expenses as { amount: number; executed_amount: number; currency: string; status: string }[],
    (e) => (e as unknown as { category: string }).category,
    preferredCurrency,
    rates
  );

  const result: CategoryBreakdownV2[] = Array.from(breakdown.entries()).map(
    ([category, vals]) => ({
      category,
      label: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ?? "#6b7280",
      ...vals,
    })
  );

  return { success: true, data: result };
}

export async function getCostCenterBreakdown(
  period?: DashboardPeriod
): Promise<ActionResult<CostCenterBreakdownV2[]>> {
  const { COST_CENTER_LABELS, COST_CENTER_COLORS } = await import("@/lib/constants");

  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Não autenticado ou sem orçamento" };

  const { supabase, preferredCurrency, rates, orcamentoId } = ctx;

  let query = supabase
    .from("expenses")
    .select("cost_center, amount, executed_amount, currency, status")
    .eq("orcamento_id", orcamentoId);

  if (period) {
    const { startOfMonth, endOfMonth } = getPeriodRange(period);
    query = query.gte("due_date", startOfMonth).lte("due_date", endOfMonth);
  }

  const { data: expenses } = await query;
  if (!expenses || expenses.length === 0) {
    return { success: true, data: [] };
  }

  const breakdown = computeBreakdown(
    expenses as { amount: number; executed_amount: number; currency: string; status: string }[],
    (e) => (e as unknown as { cost_center: string }).cost_center ?? "outros",
    preferredCurrency,
    rates
  );

  const result: CostCenterBreakdownV2[] = Array.from(breakdown.entries()).map(
    ([costCenter, vals]) => ({
      costCenter,
      label: COST_CENTER_LABELS[costCenter as keyof typeof COST_CENTER_LABELS] ?? costCenter,
      color: COST_CENTER_COLORS[costCenter as keyof typeof COST_CENTER_COLORS] ?? "#6b7280",
      ...vals,
    })
  );

  return { success: true, data: result };
}

export async function getPriorityBreakdown(
  period?: DashboardPeriod
): Promise<ActionResult<PriorityBreakdownV2[]>> {
  const { PRIORITY_LABELS } = await import("@/lib/constants");

  const PRIORITY_CHART_COLORS: Record<string, string> = {
    critical: "#f87171",
    high: "#fb923c",
    medium: "#fbbf24",
    low: "#34d399",
  };

  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Não autenticado ou sem orçamento" };

  const { supabase, preferredCurrency, rates, orcamentoId } = ctx;

  let query = supabase
    .from("expenses")
    .select("priority, amount, executed_amount, currency, status")
    .eq("orcamento_id", orcamentoId);

  if (period) {
    const { startOfMonth, endOfMonth } = getPeriodRange(period);
    query = query.gte("due_date", startOfMonth).lte("due_date", endOfMonth);
  }

  const { data: expenses } = await query;
  if (!expenses || expenses.length === 0) {
    return { success: true, data: [] };
  }

  const breakdown = computeBreakdown(
    expenses as { amount: number; executed_amount: number; currency: string; status: string }[],
    (e) => (e as unknown as { priority: string }).priority,
    preferredCurrency,
    rates
  );

  const order = ["critical", "high", "medium", "low"];
  const result: PriorityBreakdownV2[] = order
    .filter((p) => breakdown.has(p))
    .map((priority) => ({
      priority,
      label: PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] ?? priority,
      color: PRIORITY_CHART_COLORS[priority] ?? "#6b7280",
      ...breakdown.get(priority)!,
    }));

  return { success: true, data: result };
}

export async function getDailyFlow(
  period?: DashboardPeriod
): Promise<ActionResult<DailyFlowPoint[]>> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Não autenticado ou sem orçamento" };

  const { supabase, preferredCurrency, rates, orcamentoId } = ctx;
  const { startOfMonth, endOfMonth, month, year } = getPeriodRange(period);
  const daysInMonth = new Date(year, month, 0).getDate();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("due_date, amount, executed_amount, currency, status, completed_at, expense_entries")
    .eq("orcamento_id", orcamentoId);

  if (!expenses || expenses.length === 0) {
    const points: DailyFlowPoint[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      points.push({
        day: d,
        label: String(d).padStart(2, "0"),
        planned: 0,
        realized: 0,
        pending: 0,
      });
    }
    return { success: true, data: points };
  }

  const plannedPerDay = new Array(daysInMonth + 1).fill(0);
  const realizedPerDay = new Array(daysInMonth + 1).fill(0);

  for (const exp of expenses) {
    const amount = conv(exp.amount, exp.currency, preferredCurrency, rates);

    // Planned: allocate to due_date day (or day 1 if no due_date)
    const dueDate = exp.due_date ? new Date(exp.due_date + "T00:00:00") : null;
    let dueDay = 1;
    if (dueDate && dueDate.getMonth() + 1 === month && dueDate.getFullYear() === year) {
      dueDay = dueDate.getDate();
    } else if (dueDate) {
      // Due date outside this month — skip for planned
      if (
        dueDate < new Date(startOfMonth + "T00:00:00") ||
        dueDate > new Date(endOfMonth + "T23:59:59")
      ) {
        // Still count realized entries that fall in this month
        const entries = exp.expense_entries as { date: string; amount: number }[] | null;
        if (entries) {
          for (const entry of entries) {
            const entryDate = new Date(entry.date + "T00:00:00");
            if (entryDate.getMonth() + 1 === month && entryDate.getFullYear() === year) {
              const entryDay = entryDate.getDate();
              realizedPerDay[entryDay] += conv(entry.amount, exp.currency, preferredCurrency, rates);
            }
          }
        }
        continue;
      }
    }

    plannedPerDay[dueDay] += amount;

    // Realized: use expense_entries if present, else completed_at
    const entries = exp.expense_entries as { date: string; amount: number }[] | null;
    if (entries && entries.length > 0) {
      for (const entry of entries) {
        const entryDate = new Date(entry.date + "T00:00:00");
        if (entryDate.getMonth() + 1 === month && entryDate.getFullYear() === year) {
          const entryDay = entryDate.getDate();
          realizedPerDay[entryDay] += conv(entry.amount, exp.currency, preferredCurrency, rates);
        }
      }
    } else if (exp.status === "completed" && exp.completed_at) {
      const completedDate = new Date(exp.completed_at);
      if (completedDate.getMonth() + 1 === month && completedDate.getFullYear() === year) {
        const completedDay = completedDate.getDate();
        realizedPerDay[completedDay] += amount;
      }
    }
  }

  // Build cumulative
  const points: DailyFlowPoint[] = [];
  let cumulPlanned = 0;
  let cumulRealized = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    cumulPlanned += plannedPerDay[d];
    cumulRealized += realizedPerDay[d];
    points.push({
      day: d,
      label: String(d).padStart(2, "0"),
      planned: Math.round(cumulPlanned * 100) / 100,
      realized: Math.round(cumulRealized * 100) / 100,
      pending: Math.round((cumulPlanned - cumulRealized) * 100) / 100,
    });
  }

  return { success: true, data: points };
}

export async function getTopExpenses(
  period?: DashboardPeriod
): Promise<ActionResult<TopExpenseItem[]>> {
  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Não autenticado ou sem orçamento" };

  const { supabase, preferredCurrency, rates, orcamentoId } = ctx;

  let query = supabase
    .from("expenses")
    .select("name, amount, executed_amount, currency, status")
    .eq("orcamento_id", orcamentoId);

  if (period) {
    const { startOfMonth, endOfMonth } = getPeriodRange(period);
    query = query.gte("due_date", startOfMonth).lte("due_date", endOfMonth);
  }

  const { data: expenses } = await query;
  if (!expenses || expenses.length === 0) {
    return { success: true, data: [] };
  }

  const items: TopExpenseItem[] = expenses.map((e) => {
    const amount = conv(e.amount, e.currency, preferredCurrency, rates);
    const executed = conv(e.executed_amount, e.currency, preferredCurrency, rates);

    let pending = 0;
    let realized = 0;

    if (e.status === "pending") {
      pending = amount;
    } else if (e.status === "in_progress") {
      pending = amount - executed;
      realized = executed;
    } else if (e.status === "completed") {
      realized = amount;
    }

    return {
      name: e.name as string,
      planned: Math.round(amount * 100) / 100,
      pending: Math.round(pending * 100) / 100,
      realized: Math.round(realized * 100) / 100,
    };
  });

  items.sort((a, b) => b.planned - a.planned);
  return { success: true, data: items.slice(0, 15) };
}

export async function getYearlyOverview(
  year: number
): Promise<ActionResult<YearlyOverviewPoint[]>> {
  const { MONTH_LABELS } = await import("@/lib/constants");

  const ctx = await getAuthContext();
  if (!ctx) return { success: false, error: "Não autenticado ou sem orçamento" };

  const { supabase, preferredCurrency, rates, orcamentoId } = ctx;

  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const [{ data: expenses }, { data: incomes }] = await Promise.all([
    supabase
      .from("expenses")
      .select("due_date, amount, executed_amount, currency, status, completed_at, expense_entries")
      .eq("orcamento_id", orcamentoId)
      .gte("due_date", startOfYear)
      .lte("due_date", endOfYear),
    supabase
      .from("incomes")
      .select("amount, currency")
      .eq("orcamento_id", orcamentoId),
  ]);

  const monthlyRevenue = sumConverted(incomes, preferredCurrency, rates);

  const plannedPerMonth = new Array(13).fill(0);
  const realizedPerMonth = new Array(13).fill(0);

  if (expenses) {
    for (const exp of expenses) {
      const amount = conv(exp.amount, exp.currency, preferredCurrency, rates);

      // Planned: allocate to due_date month
      if (exp.due_date) {
        const dueMonth = new Date(exp.due_date + "T00:00:00").getMonth() + 1;
        if (dueMonth >= 1 && dueMonth <= 12) {
          plannedPerMonth[dueMonth] += amount;
        }
      }

      // Realized: use expense_entries if present, else completed_at
      const entries = exp.expense_entries as { date: string; amount: number }[] | null;
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          const entryDate = new Date(entry.date + "T00:00:00");
          if (entryDate.getFullYear() === year) {
            const entryMonth = entryDate.getMonth() + 1;
            realizedPerMonth[entryMonth] += conv(entry.amount, exp.currency, preferredCurrency, rates);
          }
        }
      } else if (exp.status === "completed" && exp.completed_at) {
        const completedDate = new Date(exp.completed_at);
        if (completedDate.getFullYear() === year) {
          const completedMonth = completedDate.getMonth() + 1;
          realizedPerMonth[completedMonth] += amount;
        }
      }
    }
  }

  const MONTH_ABBR: Record<number, string> = {
    1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
    7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
  };

  const points: YearlyOverviewPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const planned = Math.round(plannedPerMonth[m] * 100) / 100;
    const realized = Math.round(realizedPerMonth[m] * 100) / 100;
    const revenue = Math.round(monthlyRevenue * 100) / 100;
    points.push({
      month: m,
      label: MONTH_ABBR[m],
      planned,
      realized,
      revenue,
      balance: Math.round((revenue - realized) * 100) / 100,
    });
  }

  return { success: true, data: points };
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

  const orcamentoId = await getSelectedOrcamentoId();
  if (!orcamentoId) {
    return { success: false, error: "Nenhum orçamento selecionado" };
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPriorityListExpenses error:", error.message, error.code);
    return { success: false, error: `Erro ao buscar despesas: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}
