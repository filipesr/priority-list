"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Expense } from "@/lib/types";

export async function getHistory(filters?: {
  category?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ActionResult<Expense[]>> {
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
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.startDate) {
    query = query.gte("completed_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("completed_at", `${filters.endDate}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: "Erro ao buscar histórico" };
  }

  return { success: true, data: data ?? [] };
}
