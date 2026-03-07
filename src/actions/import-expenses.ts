"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import type { ExpenseFormData } from "@/lib/validations/expense";

export async function importExpenses(
  expenses: ExpenseFormData[]
): Promise<ActionResult<{ imported: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  if (expenses.length === 0) {
    return { success: false, error: "Nenhuma despesa para importar" };
  }

  // Fetch profile for author name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const createdByName = profile?.full_name ?? "Desconhecido";

  const rows = expenses.map((e) => ({
    ...e,
    user_id: user.id,
    cost_center: e.cost_center ?? "outros",
    created_by_name: createdByName,
    due_date: e.due_date || null,
    description: e.description || null,
    custom_category: e.custom_category || null,
    notes: e.notes || null,
    recurrence_frequency: e.recurrence_frequency || null,
    recurrence_day: e.recurrence_day ?? null,
    recurrence_month: e.recurrence_month ?? null,
  }));

  const { error } = await supabase.from("expenses").insert(rows);

  if (error) {
    return { success: false, error: "Erro ao importar despesas" };
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, data: { imported: rows.length } };
}
