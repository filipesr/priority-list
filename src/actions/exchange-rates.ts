"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, ExchangeRate, SupportedCurrency } from "@/lib/types";
import type { RateMap } from "@/lib/currency";
import {
  exchangeRateSchema,
  type ExchangeRateFormData,
} from "@/lib/validations/exchange-rate";

export async function getExchangeRates(): Promise<ActionResult<ExchangeRate[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .order("effective_date", { ascending: false });

  if (error) {
    return { success: false, error: `Erro ao buscar taxas: ${error.message}` };
  }

  return { success: true, data: data ?? [] };
}

export async function getLatestRates(): Promise<RateMap> {
  const supabase = await createClient();

  const currencies: SupportedCurrency[] = ["BRL", "PYG"];
  const rates: RateMap = { BRL: 1, USD: 1, PYG: 1 };

  for (const currency of currencies) {
    const { data } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency", currency)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      rates[currency] = Number(data.rate);
    }
  }

  return rates;
}

export async function createExchangeRate(
  data: ExchangeRateFormData
): Promise<ActionResult<ExchangeRate>> {
  const parsed = exchangeRateSchema.safeParse(data);
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

  const { data: rate, error } = await supabase
    .from("exchange_rates")
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Erro ao criar taxa: ${error.message}` };
  }

  revalidatePath("/exchange-rates");
  revalidatePath("/dashboard");
  return { success: true, data: rate };
}

export async function deleteExchangeRate(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { error } = await supabase
    .from("exchange_rates")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: `Erro ao excluir taxa: ${error.message}` };
  }

  revalidatePath("/exchange-rates");
  revalidatePath("/dashboard");
  return { success: true };
}
