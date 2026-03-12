import { Suspense } from "react";
import { getHistory } from "@/actions/history";
import { getUserCurrencyAndRates } from "@/actions/exchange-rates";
import { HistoryList } from "@/components/history/history-list";
import { HistoryFilters } from "@/components/history/history-filters";
import { Skeleton } from "@/components/ui/skeleton";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  // Default to current month when no date filters are provided
  let startDate = params.startDate;
  let endDate = params.endDate;
  if (!startDate && !endDate) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    endDate = new Date(y, m, 0).toISOString().split("T")[0];
  }

  const [result, { preferredCurrency, rates }] = await Promise.all([
    getHistory({
      category: params.category,
      cost_center: params.cost_center,
      startDate,
      endDate,
    }),
    getUserCurrencyAndRates(),
  ]);

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
