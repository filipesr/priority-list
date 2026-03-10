import { createClient } from "@/lib/supabase/server";
import { getExchangeRates } from "@/actions/exchange-rates";
import { ExchangeRateForm } from "@/components/exchange-rates/exchange-rate-form";
import { ExchangeRateChart } from "@/components/exchange-rates/exchange-rate-chart";
import { ExchangeRateHistory } from "@/components/exchange-rates/exchange-rate-history";

export default async function ExchangeRatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const result = await getExchangeRates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Câmbio</h1>
        <p className="text-muted-foreground">
          Gerencie as taxas de câmbio (1 USD = X moeda)
        </p>
      </div>

      <ExchangeRateForm />

      {result.success && (
        <>
          <ExchangeRateChart rates={result.data ?? []} />
          <ExchangeRateHistory rates={result.data ?? []} isAdmin={isAdmin} />
        </>
      )}
    </div>
  );
}
