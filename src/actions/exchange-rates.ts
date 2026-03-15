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

export type RateMeta = {
  notes: string | null;
  effective_date: string;
  created_at: string;
};

export async function getLatestRates(): Promise<RateMap> {
  const { rates } = await getLatestRatesWithMeta();
  return rates;
}

export async function getLatestRatesWithMeta(): Promise<{
  rates: RateMap;
  meta: Partial<Record<SupportedCurrency, RateMeta>>;
}> {
  const supabase = await createClient();

  const rates: RateMap = { BRL: 1, USD: 1, PYG: 1 };
  const meta: Partial<Record<SupportedCurrency, RateMeta>> = {};

  const { data } = await supabase
    .from("exchange_rates")
    .select("currency, rate, effective_date, notes, created_at")
    .in("currency", ["BRL", "PYG"])
    .order("effective_date", { ascending: false });

  if (data) {
    const seen = new Set<string>();
    for (const row of data) {
      if (!seen.has(row.currency)) {
        seen.add(row.currency);
        const currency = row.currency as SupportedCurrency;
        rates[currency] = Number(row.rate);
        meta[currency] = {
          notes: row.notes,
          effective_date: row.effective_date,
          created_at: row.created_at,
        };
      }
    }
  }

  return { rates, meta };
}

export async function getUserCurrencyAndRates(): Promise<{
  preferredCurrency: SupportedCurrency;
  rates: RateMap;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, rates] = await Promise.all([
    supabase
      .from("profiles")
      .select("preferred_currency")
      .eq("id", user!.id)
      .single(),
    getLatestRates(),
  ]);

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;
  return { preferredCurrency, rates };
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

const CHACO_URL = "https://www.cambioschaco.com.py/api/branch_office/9/exchange";
const LAMONEDA_URL = "https://www.lamoneda.com.py/api/cotizaciones?sucursal=sucursal_jebai";
const TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchChacoRates(): Promise<{ pygRate: number; brlRate: number; source: string }> {
  const res = await fetchWithTimeout(CHACO_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const items: Array<{ isoCode: string; purchasePrice: number; purchaseArbitrage: number }> = json.items ?? [];
  const usdItem = items.find((i) => i.isoCode === "USD");
  const brlItem = items.find((i) => i.isoCode === "BRL");
  if (!usdItem || !brlItem) throw new Error("Dados incompletos");
  return { pygRate: usdItem.purchasePrice, brlRate: brlItem.purchaseArbitrage, source: "Câmbios Chaco, CDE" };
}

async function fetchLaMonedaRates(): Promise<{ pygRate: number; brlRate: number; source: string }> {
  const res = await fetchWithTimeout(LAMONEDA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const cotizaciones: Array<{ moneda1: string; moneda2: string; compra: number }> = json.cotizaciones ?? [];
  const usdPyg = cotizaciones.find((c) => c.moneda1 === "DOLAR" && c.moneda2 === "GUARANI");
  const brlPyg = cotizaciones.find((c) => c.moneda1 === "REAL" && c.moneda2 === "GUARANI");
  if (!usdPyg || !brlPyg) throw new Error("Dados incompletos");
  const pygRate = usdPyg.compra;
  const usdBrl = cotizaciones.find((c) => c.moneda1 === "DOLAR" && c.moneda2 === "REAL");
  const brlRate = usdBrl ? usdBrl.compra : brlPyg.compra / usdPyg.compra;
  return { pygRate, brlRate, source: "La Moneda, CDE" };
}

export async function importExchangeRates(): Promise<
  ActionResult<{ imported: string[] }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  let pygRate: number;
  let brlRate: number;
  let source: string;

  try {
    ({ pygRate, brlRate, source } = await fetchChacoRates());
  } catch (chacoErr) {
    console.error("[importExchangeRates] Chaco failed, trying La Moneda:", chacoErr);
    try {
      ({ pygRate, brlRate, source } = await fetchLaMonedaRates());
    } catch (laMonedaErr) {
      console.error("[importExchangeRates] La Moneda also failed:", laMonedaErr);
      return { success: false, error: "Ambas as fontes de câmbio falharam" };
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const imported: string[] = [];

  // Only check if there's already a rate for today
  const { data: todayRates } = await supabase
    .from("exchange_rates")
    .select("currency")
    .eq("effective_date", today)
    .in("currency", ["BRL", "PYG"]);

  const alreadyImported = new Set((todayRates ?? []).map((r) => r.currency));

  const toImport: Array<{ currency: SupportedCurrency; rate: number }> = [];
  if (!alreadyImported.has("PYG")) {
    toImport.push({ currency: "PYG", rate: pygRate });
  }
  if (!alreadyImported.has("BRL")) {
    toImport.push({ currency: "BRL", rate: brlRate });
  }

  for (const { currency, rate } of toImport) {
    const { error } = await supabase.from("exchange_rates").insert({
      currency,
      rate,
      effective_date: today,
      notes: `Importado do ${source}`,
      created_by: user.id,
    });
    if (!error) {
      imported.push(currency);
    }
  }

  revalidatePath("/exchange-rates");
  revalidatePath("/dashboard");
  return { success: true, data: { imported } };
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
