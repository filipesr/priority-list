"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";
import type { PendenciaFormData } from "@/lib/validations/pendencia";

export async function importPendencias(
  pendencias: PendenciaFormData[]
): Promise<ActionResult<{ imported: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  if (pendencias.length === 0) {
    return { success: false, error: "Nenhuma pendência para importar" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const createdByName = profile?.full_name ?? "Desconhecido";

  const rows = pendencias.map((p) => ({
    ...p,
    user_id: user.id,
    estimated_amount: p.estimated_amount ?? null,
    description: p.description || null,
    notes: p.notes || null,
    created_by_name: createdByName,
  }));

  const { error } = await supabase.from("pendencias").insert(rows);

  if (error) {
    return { success: false, error: "Erro ao importar pendências" };
  }

  revalidatePath("/pendencias");
  return { success: true, data: { imported: rows.length } };
}
