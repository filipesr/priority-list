import { Suspense } from "react";
import { getHistory } from "@/actions/history";
import { getLatestRates } from "@/actions/exchange-rates";
import { createClient } from "@/lib/supabase/server";
import { HistoryList } from "@/components/history/history-list";
import { HistoryFilters } from "@/components/history/history-filters";
import { Skeleton } from "@/components/ui/skeleton";
import type { SupportedCurrency } from "@/lib/types";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const result = await getHistory({
    category: params.category,
    cost_center: params.cost_center,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_currency")
    .eq("id", user!.id)
    .single();

  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as SupportedCurrency;
  const rates = await getLatestRates();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Histórico</h1>
        <p className="text-muted-foreground">
          Despesas concluídas e pagamentos realizados
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <HistoryFilters />
      </Suspense>

      {result.success ? (
        <HistoryList
          expenses={result.data ?? []}
          preferredCurrency={preferredCurrency}
          rates={rates}
        />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
