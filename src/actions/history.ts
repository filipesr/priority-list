"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Expense } from "@/lib/types";
import { getSelectedOrcamentoId } from "@/actions/orcamentos";

export async function getHistory(filters?: {
  category?: string;
  cost_center?: string;
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

  const orcamentoId = await getSelectedOrcamentoId();
  if (!orcamentoId) {
    return { success: false, error: "Nenhum orçamento selecionado" };
  }

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.cost_center) {
    query = query.eq("cost_center", filters.cost_center);
  }
  if (filters?.startDate) {
    query = query.gte("completed_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("completed_at", `${filters.endDate}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getHistory error:", error.message, error.code);
    return { success: false, error: `Erro ao buscar histórico: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}
