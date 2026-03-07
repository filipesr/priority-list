"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Income, SupportedCurrency } from "@/lib/types";
import { incomeSchema, type IncomeFormData } from "@/lib/validations/income";
import { getLatestRates } from "@/actions/exchange-rates";
import { convertAmount } from "@/lib/currency";

export async function createIncome(
  data: IncomeFormData
): Promise<ActionResult<Income>> {
  const parsed = incomeSchema.safeParse(data);
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

  const { data: income, error } = await supabase
    .from("incomes")
    .insert({
      ...parsed.data,
      user_id: user.id,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
      recurrence_frequency: parsed.data.recurrence_frequency || null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Erro ao criar receita: ${error.message}` };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { success: true, data: income };
}

export async function updateIncome(
  id: string,
  data: IncomeFormData
): Promise<ActionResult<Income>> {
  const parsed = incomeSchema.safeParse(data);
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

  const { data: income, error } = await supabase
    .from("incomes")
    .update({
      ...parsed.data,
      description: parsed.data.description || null,
      notes: parsed.data.notes || null,
      recurrence_frequency: parsed.data.recurrence_frequency || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: `Erro ao atualizar receita: ${error.message}` };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { success: true, data: income };
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase.from("incomes").delete().eq("id", id);

  if (error) {
    return { success: false, error: `Erro ao excluir receita: ${error.message}` };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getIncomes(): Promise<ActionResult<Income[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data, error } = await supabase
    .from("incomes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: `Erro ao buscar receitas: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}

export interface IncomeSummary {
  incomes: Income[];
  totalInPreferredCurrency: number;
  preferredCurrency: SupportedCurrency;
}

export async function getIncomeSummary(): Promise<ActionResult<IncomeSummary>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;

  const { data: incomes } = await supabase
    .from("incomes")
    .select("*")
    .order("created_at", { ascending: false });

  const rates = await getLatestRates();

  const totalInPreferredCurrency = (incomes ?? []).reduce(
    (sum, income) =>
      sum +
      convertAmount(
        Number(income.amount),
        income.currency as SupportedCurrency,
        preferredCurrency,
        rates
      ),
    0
  );

  return {
    success: true,
    data: {
      incomes: incomes ?? [],
      totalInPreferredCurrency,
      preferredCurrency,
    },
  };
}
