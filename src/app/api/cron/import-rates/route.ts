import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportedCurrency } from "@/lib/types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    "https://www.cambioschaco.com.py/api/branch_office/9/exchange"
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: "Erro ao buscar taxas do Câmbios Chaco" },
      { status: 502 }
    );
  }

  const json = await res.json();
  const items: Array<{
    isoCode: string;
    purchasePrice: number;
    purchaseArbitrage: number;
  }> = json.items ?? [];

  const usdItem = items.find((i) => i.isoCode === "USD");
  const brlItem = items.find((i) => i.isoCode === "BRL");

  if (!usdItem || !brlItem) {
    return NextResponse.json(
      { error: "Dados incompletos da API" },
      { status: 502 }
    );
  }

  const pygRate = usdItem.purchasePrice;
  const brlRate = brlItem.purchaseArbitrage;

  const supabase = createAdminClient();

  // Fetch current latest rates
  const currencies: SupportedCurrency[] = ["BRL", "PYG"];
  const currentRates: Record<string, number> = { BRL: 1, PYG: 1 };

  for (const currency of currencies) {
    const { data } = await supabase
      .from("exchange_rates")
      .select("rate")
      .eq("currency", currency)
      .order("effective_date", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      currentRates[currency] = Number(data.rate);
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const imported: string[] = [];

  const toImport: Array<{ currency: SupportedCurrency; rate: number }> = [];
  if (Math.abs(pygRate - currentRates.PYG) > 0.001) {
    toImport.push({ currency: "PYG", rate: pygRate });
  }
  if (Math.abs(brlRate - currentRates.BRL) > 0.001) {
    toImport.push({ currency: "BRL", rate: brlRate });
  }

  for (const { currency, rate } of toImport) {
    const { error } = await supabase.from("exchange_rates").insert({
      currency,
      rate,
      effective_date: today,
      notes: "Importado do Câmbios Chaco, CDE",
    });
    if (!error) {
      imported.push(currency);
    }
  }

  return NextResponse.json({ imported });
}
