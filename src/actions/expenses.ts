"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Expense, ExpenseEntry, ExpenseFilters } from "@/lib/types";
import { expenseSchema, type ExpenseFormData } from "@/lib/validations/expense";
import { computeNextDueDate } from "@/lib/recurrence";
import { getSelectedOrcamentoId } from "@/actions/orcamentos";

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

  const orcamentoId = await getSelectedOrcamentoId();
  if (!orcamentoId) {
    return { success: false, error: "Nenhum orçamento selecionado" };
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
      orcamento_id: orcamentoId,
      cost_center: parsed.data.cost_center ?? "outros",
      currency: parsed.data.currency ?? "BRL",
      created_by_name: profile?.full_name ?? "Desconhecido",
      due_date: parsed.data.due_date || null,
      description: parsed.data.description || null,
      custom_category: parsed.data.custom_category || null,
      notes: parsed.data.notes || null,
      recurrence_frequency: parsed.data.recurrence_frequency || null,
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
      due_date: parsed.data.due_date || null,
      description: parsed.data.description || null,
      custom_category: parsed.data.custom_category || null,
      notes: parsed.data.notes || null,
      recurrence_frequency: parsed.data.recurrence_frequency || null,
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
      expense.due_date,
    );

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

  const orcamentoId = await getSelectedOrcamentoId();
  if (!orcamentoId) {
    return { success: false, error: "Nenhum orçamento selecionado" };
  }

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("orcamento_id", orcamentoId)
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
  if (filters?.period === "current_month") {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const startOfMonth = `${y}-${String(m).padStart(2, "0")}-01`;
    const endOfMonth = new Date(y, m, 0).toISOString().split("T")[0];
    query = query.or(`and(due_date.gte.${startOfMonth},due_date.lte.${endOfMonth}),due_date.is.null`);
  } else if (filters?.period === "future") {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const endOfMonth = new Date(y, m, 0).toISOString().split("T")[0];
    query = query.gt("due_date", endOfMonth);
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

  const orcamentoId = await getSelectedOrcamentoId();
  if (!orcamentoId) {
    return { success: false, error: "Nenhum orçamento selecionado" };
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .eq("orcamento_id", orcamentoId)
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

  const updateData: Record<string, unknown> = {
    expense_entries: entries,
    executed_amount: executedAmount,
  };

  // Auto-adjust amount upward when entries exceed the planned value
  if (executedAmount > expense.amount) {
    updateData.amount = executedAmount;
  }

  const { data: updated, error: updateError } = await supabase
    .from("expenses")
    .update(updateData)
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

export async function convertExpenseToPendencia(
  expenseId: string
): Promise<ActionResult> {
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

  const { error: insertError } = await supabase
    .from("pendencias")
    .insert({
      user_id: user.id,
      orcamento_id: expense.orcamento_id,
      name: expense.name,
      description: expense.description || null,
      estimated_amount: expense.amount,
      currency: expense.currency ?? "BRL",
      category: expense.category,
      cost_center: expense.cost_center ?? "outros",
      urgency: expense.urgency,
      priority: expense.priority,
      notes: expense.notes || null,
      status: "pending",
      created_by_name: expense.created_by_name,
    });

  if (insertError) {
    return { success: false, error: `Erro ao criar pendência: ${insertError.message}` };
  }

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (deleteError) {
    return { success: false, error: `Erro ao excluir despesa: ${deleteError.message}` };
  }

  revalidatePath("/expenses");
  revalidatePath("/pendencias");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function postponeExpense(
  expenseId: string,
  newDueDate: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase
    .from("expenses")
    .update({ due_date: newDueDate })
    .eq("id", expenseId);

  if (error) {
    return { success: false, error: `Erro ao adiar despesa: ${error.message}` };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
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
