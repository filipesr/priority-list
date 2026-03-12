"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Pendencia, PendenciaFilters } from "@/lib/types";
import {
  pendenciaSchema,
  executePendenciaSchema,
  type PendenciaFormData,
  type ExecutePendenciaFormData,
} from "@/lib/validations/pendencia";
import { addMonths } from "date-fns";
import { getSelectedOrcamentoId } from "@/actions/orcamentos";

export async function createPendencia(
  data: PendenciaFormData
): Promise<ActionResult<Pendencia>> {
  const parsed = pendenciaSchema.safeParse(data);
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: pendencia, error } = await supabase
    .from("pendencias")
    .insert({
      ...parsed.data,
      user_id: user.id,
      orcamento_id: orcamentoId,
      estimated_amount: parsed.data.estimated_amount ?? null,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
      created_by_name: profile?.full_name ?? "Desconhecido",
    })
    .select()
    .single();

  if (error) {
    console.error("createPendencia error:", error.message, error.code);
    return { success: false, error: `Erro ao criar pendência: ${error.message}` };
  }

  revalidatePath("/pendencias");
  return { success: true, data: pendencia };
}

export async function updatePendencia(
  id: string,
  data: PendenciaFormData
): Promise<ActionResult<Pendencia>> {
  const parsed = pendenciaSchema.safeParse(data);
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

  const { data: pendencia, error } = await supabase
    .from("pendencias")
    .update({
      ...parsed.data,
      estimated_amount: parsed.data.estimated_amount ?? null,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updatePendencia error:", error.message, error.code);
    return { success: false, error: `Erro ao atualizar pendência: ${error.message}` };
  }

  revalidatePath("/pendencias");
  return { success: true, data: pendencia };
}

export async function deletePendencia(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase
    .from("pendencias")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deletePendencia error:", error.message, error.code);
    return { success: false, error: `Erro ao excluir pendência: ${error.message}` };
  }

  revalidatePath("/pendencias");
  return { success: true };
}

export async function getPendencias(
  filters?: PendenciaFilters
): Promise<ActionResult<Pendencia[]>> {
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
    .from("pendencias")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.neq("status", "resolved");
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters?.urgency) {
    query = query.eq("urgency", filters.urgency);
  }
  if (filters?.cost_center) {
    query = query.eq("cost_center", filters.cost_center);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getPendencias error:", error.message, error.code);
    return { success: false, error: `Erro ao buscar pendências: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}

export async function getPendencia(
  id: string
): Promise<ActionResult<Pendencia>> {
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
    .from("pendencias")
    .select("*")
    .eq("id", id)
    .eq("orcamento_id", orcamentoId)
    .single();

  if (error) {
    return { success: false, error: "Pendência não encontrada" };
  }

  return { success: true, data };
}

export async function executePendencia(
  id: string,
  data: ExecutePendenciaFormData
): Promise<ActionResult> {
  const parsed = executePendenciaSchema.safeParse(data);
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

  // Fetch the pendencia
  const { data: pendencia, error: fetchError } = await supabase
    .from("pendencias")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !pendencia) {
    return { success: false, error: "Pendência não encontrada" };
  }

  if (pendencia.status === "resolved") {
    return { success: false, error: "Pendência já foi resolvida" };
  }

  // Fetch profile for author name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const createdByName = profile?.full_name ?? "Desconhecido";
  const { payment_mode, amount, currency, installments, start_date } = parsed.data;

  if (payment_mode === "single") {
    // Create 1 expense
    const { error: insertError } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        orcamento_id: pendencia.orcamento_id,
        name: pendencia.name,
        description: pendencia.description,
        amount,
        currency,
        category: pendencia.category,
        cost_center: pendencia.cost_center,
        type: "esporadico",
        priority: pendencia.priority,
        urgency: pendencia.urgency,

        due_date: start_date,
        notes: pendencia.notes,
        created_by_name: createdByName,
      });

    if (insertError) {
      console.error("executePendencia insert error:", insertError.message);
      return { success: false, error: `Erro ao criar despesa: ${insertError.message}` };
    }
  } else {
    // Create N expenses (installments)
    const numInstallments = installments ?? 2;
    const installmentAmount = Math.round((amount / numInstallments) * 100) / 100;
    const baseDate = new Date(start_date);

    const expenses = Array.from({ length: numInstallments }, (_, i) => {
      const dueDate = addMonths(baseDate, i);
      return {
        user_id: user.id,
        orcamento_id: pendencia.orcamento_id,
        name: `${pendencia.name} (${i + 1}/${numInstallments})`,
        description: pendencia.description,
        amount: installmentAmount,
        currency,
        category: pendencia.category,
        cost_center: pendencia.cost_center,
        type: "recorrente" as const,
        priority: pendencia.priority,
        urgency: pendencia.urgency,

        recurrence_frequency: "monthly",
        due_date: dueDate.toISOString().split("T")[0],
        notes: pendencia.notes,
        created_by_name: createdByName,
      };
    });

    const { error: insertError } = await supabase
      .from("expenses")
      .insert(expenses);

    if (insertError) {
      console.error("executePendencia insert error:", insertError.message);
      return { success: false, error: `Erro ao criar despesas: ${insertError.message}` };
    }
  }

  // Mark pendencia as resolved
  const { error: updateError } = await supabase
    .from("pendencias")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("executePendencia update error:", updateError.message);
    return { success: false, error: `Erro ao resolver pendência: ${updateError.message}` };
  }

  revalidatePath("/pendencias");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}
