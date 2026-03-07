"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Budget } from "@/lib/types";

export async function upsertBudget(
  month: number,
  year: number,
  totalLimit: number,
  notes?: string
): Promise<ActionResult<Budget>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  if (totalLimit <= 0) {
    return { success: false, error: "Limite deve ser maior que zero" };
  }

  // Check if budget exists for this month/year (shared)
  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("month", month)
    .eq("year", year)
    .single();

  let result;

  if (existing) {
    result = await supabase
      .from("budgets")
      .update({ total_limit: totalLimit, notes: notes || null })
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        month,
        year,
        total_limit: totalLimit,
        notes: notes || null,
      })
      .select()
      .single();
  }

  if (result.error) {
    return { success: false, error: "Erro ao salvar orçamento" };
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { success: true, data: result.data };
}

export async function getBudget(
  month: number,
  year: number
): Promise<ActionResult<Budget | null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data } = await supabase
    .from("budgets")
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .single();

  return { success: true, data: data ?? null };
}

export interface BudgetSummary {
  budget: Budget | null;
  totalSpent: number;
  totalCommitted: number;
  totalPending: number;
}

export async function getBudgetSummary(
  month: number,
  year: number
): Promise<ActionResult<BudgetSummary>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const endOfMonth = new Date(year, month, 0).toISOString().split("T")[0];

  const [budgetResult, spentResult, committedResult, pendingResult] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("month", month)
        .eq("year", year)
        .single(),
      supabase
        .from("expenses")
        .select("amount")
        .eq("status", "completed")
        .gte("completed_at", startOfMonth)
        .lte("completed_at", `${endOfMonth}T23:59:59`),
      supabase
        .from("expenses")
        .select("amount")
        .eq("status", "in_progress"),
      supabase
        .from("expenses")
        .select("amount")
        .eq("status", "pending"),
    ]);

  const sum = (items: { amount: number }[] | null) =>
    items?.reduce((s, i) => s + Number(i.amount), 0) ?? 0;

  return {
    success: true,
    data: {
      budget: budgetResult.data ?? null,
      totalSpent: sum(spentResult.data),
      totalCommitted: sum(committedResult.data),
      totalPending: sum(pendingResult.data),
    },
  };
}
