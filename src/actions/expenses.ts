"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Expense, ExpenseEntry, ExpenseFilters } from "@/lib/types";
import { expenseSchema, type ExpenseFormData } from "@/lib/validations/expense";
import type { RecurrenceFrequency } from "@/lib/types";

/**
 * Returns the current period's due date as YYYY-MM-DD string.
 * E.g. monthly day 5, today is March 7 → "2026-03-05"
 */
function computeCurrentDueDate(
  frequency: RecurrenceFrequency | null,
  day: number | null,
  month: number | null,
): string | null {
  if (!frequency || day == null) return null;
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();

  if (frequency === "monthly") {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const d = Math.min(day, daysInMonth);
    return formatDateISO(new Date(y, m, d));
  }
  if (frequency === "yearly") {
    const ym = (month ?? 1) - 1;
    const daysInMonth = new Date(y, ym + 1, 0).getDate();
    const d = Math.min(day, daysInMonth);
    return formatDateISO(new Date(y, ym, d));
  }
  // weekly
  const currentDay = today.getDay();
  const diff = day - currentDay;
  const result = new Date(today);
  result.setDate(result.getDate() + diff);
  return formatDateISO(result);
}

/**
 * Returns the NEXT period's due date as YYYY-MM-DD string.
 * If a current due_date exists, advances from it; otherwise advances from current period.
 */
function computeNextDueDate(
  frequency: RecurrenceFrequency | null,
  day: number | null,
  month: number | null,
  currentDueDate: string | null,
): string | null {
  if (!frequency || day == null) return null;

  // Start from the current due date or compute the current period's date
  const base = currentDueDate
    ? new Date(currentDueDate + "T00:00:00")
    : (() => {
        const cd = computeCurrentDueDate(frequency, day, month);
        return cd ? new Date(cd + "T00:00:00") : new Date();
      })();

  if (frequency === "monthly") {
    const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, daysInMonth));
    return formatDateISO(next);
  }
  if (frequency === "yearly") {
    const next = new Date(base.getFullYear() + 1, (month ?? 1) - 1, 1);
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

export async function createExpense(
  data: ExpenseFormData
): Promise<ActionResult<Expense>> {
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  // Fetch profile for author name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      ...parsed.data,
      user_id: user.id,
      cost_center: parsed.data.cost_center ?? "outros",
      currency: parsed.data.currency ?? "BRL",
      created_by_name: profile?.full_name ?? "Desconhecido",
      due_date: parsed.data.due_date || (
        parsed.data.is_recurring
          ? computeCurrentDueDate(parsed.data.recurrence_frequency ?? null, parsed.data.recurrence_day ?? null, parsed.data.recurrence_month ?? null)
          : null
      ),
      description: parsed.data.description || null,
      custom_category: parsed.data.custom_category || null,
      notes: parsed.data.notes || null,
      recurrence_frequency: parsed.data.recurrence_frequency || null,
      recurrence_day: parsed.data.recurrence_day ?? null,
      recurrence_month: parsed.data.recurrence_month ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("createExpense error:", error.message, error.code);
    return { success: false, error: `Erro ao criar despesa: ${error.message}` };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, data: expense };
}

export async function updateExpense(
  id: string,
  data: ExpenseFormData
): Promise<ActionResult<Expense>> {
  const parsed = expenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .update({
      ...parsed.data,
      cost_center: parsed.data.cost_center ?? "outros",
      currency: parsed.data.currency ?? "BRL",
      due_date: parsed.data.due_date || (
        parsed.data.is_recurring
          ? computeCurrentDueDate(parsed.data.recurrence_frequency ?? null, parsed.data.recurrence_day ?? null, parsed.data.recurrence_month ?? null)
          : null
      ),
      description: parsed.data.description || null,
      custom_category: parsed.data.custom_category || null,
      notes: parsed.data.notes || null,
      recurrence_frequency: parsed.data.recurrence_frequency || null,
      recurrence_day: parsed.data.recurrence_day ?? null,
      recurrence_month: parsed.data.recurrence_month ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateExpense error:", error.message, error.code);
    return { success: false, error: `Erro ao atualizar despesa: ${error.message}` };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, data: expense };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteExpense error:", error.message, error.code);
    return { success: false, error: `Erro ao excluir despesa: ${error.message}` };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateExpenseStatus(
  id: string,
  status: "pending" | "in_progress" | "completed"
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  // Fetch full expense to check if recurring
  const { data: expense } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (!expense) {
    return { success: false, error: "Despesa não encontrada" };
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
    // Mark completed occurrence as non-recurring (it's now history)
    if (expense.is_recurring) {
      updateData.is_recurring = false;
    }
  } else {
    updateData.completed_at = null;
  }

  const { error } = await supabase
    .from("expenses")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("updateExpenseStatus error:", error.message, error.code);
    return { success: false, error: `Erro ao atualizar status: ${error.message}` };
  }

  // Create next occurrence for recurring expenses
  if (status === "completed" && expense.is_recurring) {
    const nextDueDate = computeNextDueDate(
      expense.recurrence_frequency,
      expense.recurrence_day,
      expense.recurrence_month,
      expense.due_date,
    );

    // Set due_date on the completed occurrence for historical record
    if (!expense.due_date && nextDueDate) {
      await supabase
        .from("expenses")
        .update({ due_date: computeCurrentDueDate(
          expense.recurrence_frequency,
          expense.recurrence_day,
          expense.recurrence_month,
        ) })
        .eq("id", id);
    }

    const { id: _id, created_at: _ca, updated_at: _ua, completed_at: _coa, ...rest } = expense;
    const { error: insertError } = await supabase
      .from("expenses")
      .insert({
        ...rest,
        status: "pending",
        is_recurring: true,
        completed_at: null,
        due_date: nextDueDate,
        executed_amount: 0,
        expense_entries: [],
      });

    if (insertError) {
      console.error("createNextOccurrence error:", insertError.message);
      // Don't fail the whole operation — the original was already completed
    }
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

export async function getExpenses(
  filters?: ExpenseFilters
): Promise<ActionResult<Expense[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  let query = supabase
    .from("expenses")
    .select("*")
    .neq("status", "completed")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.cost_center) {
    query = query.eq("cost_center", filters.cost_center);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getExpenses error:", error.message, error.code);
    return { success: false, error: `Erro ao buscar despesas: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}

export async function getExpense(
  id: string
): Promise<ActionResult<Expense>> {
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
    .eq("id", id)
    .single();

  if (error) {
    return { success: false, error: "Despesa não encontrada" };
  }

  return { success: true, data };
}

export async function addExpenseEntry(
  expenseId: string,
  entry: ExpenseEntry
): Promise<ActionResult<Expense>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();

  if (fetchError || !expense) {
    return { success: false, error: "Despesa não encontrada" };
  }

  const entries: ExpenseEntry[] = [...(expense.expense_entries ?? []), entry];
  const executedAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  const { data: updated, error: updateError } = await supabase
    .from("expenses")
    .update({
      expense_entries: entries,
      executed_amount: executedAmount,
    })
    .eq("id", expenseId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: `Erro ao adicionar lançamento: ${updateError.message}` };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, data: updated };
}

export async function removeExpenseEntry(
  expenseId: string,
  entryIndex: number
): Promise<ActionResult<Expense>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();

  if (fetchError || !expense) {
    return { success: false, error: "Despesa não encontrada" };
  }

  const entries: ExpenseEntry[] = [...(expense.expense_entries ?? [])];
  if (entryIndex < 0 || entryIndex >= entries.length) {
    return { success: false, error: "Índice inválido" };
  }

  entries.splice(entryIndex, 1);
  const executedAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  const { data: updated, error: updateError } = await supabase
    .from("expenses")
    .update({
      expense_entries: entries,
      executed_amount: executedAmount,
    })
    .eq("id", expenseId)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: `Erro ao remover lançamento: ${updateError.message}` };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, data: updated };
}
