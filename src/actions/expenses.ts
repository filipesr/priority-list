"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Expense, ExpenseFilters } from "@/lib/types";
import { expenseSchema, type ExpenseFormData } from "@/lib/validations/expense";

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
      due_date: parsed.data.due_date || null,
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
      due_date: parsed.data.due_date || null,
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

  const updateData: Record<string, unknown> = { status };
  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
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
