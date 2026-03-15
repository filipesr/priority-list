import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportedCurrency } from "@/lib/types";

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

async function fetchChaco(): Promise<{ pygRate: number; brlRate: number; source: string }> {
  const res = await fetchWithTimeout(CHACO_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const items: Array<{ isoCode: string; purchasePrice: number; purchaseArbitrage: number }> = json.items ?? [];
  const usdItem = items.find((i) => i.isoCode === "USD");
  const brlItem = items.find((i) => i.isoCode === "BRL");
  if (!usdItem || !brlItem) throw new Error("Dados incompletos");
  return { pygRate: usdItem.purchasePrice, brlRate: brlItem.purchaseArbitrage, source: "Câmbios Chaco, CDE" };
}

async function fetchLaMoneda(): Promise<{ pygRate: number; brlRate: number; source: string }> {
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

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pygRate: number;
  let brlRate: number;
  let source: string;

  try {
    ({ pygRate, brlRate, source } = await fetchChaco());
  } catch (chacoErr) {
    console.error("[cron/import-rates] Chaco failed, trying La Moneda:", chacoErr);
    try {
      ({ pygRate, brlRate, source } = await fetchLaMoneda());
    } catch (laMonedaErr) {
      console.error("[cron/import-rates] La Moneda also failed:", laMonedaErr);
      return NextResponse.json(
        { error: "Ambas as fontes de câmbio falharam" },
        { status: 502 }
      );
    }
  }

  const supabase = createAdminClient();
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
    });
    if (!error) {
      imported.push(currency);
    }
  }

  return NextResponse.json({ imported });
}
