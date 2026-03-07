"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, SupportedCurrency } from "@/lib/types";

export async function updatePreferredCurrency(
  currency: SupportedCurrency
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_currency: currency })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: `Erro ao atualizar moeda: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/history");
  revalidatePath("/income");
  revalidatePath("/exchange-rates");
  return { success: true };
}
