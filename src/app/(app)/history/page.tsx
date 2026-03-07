import { Suspense } from "react";
import { getHistory } from "@/actions/history";
import { HistoryList } from "@/components/history/history-list";
import { HistoryFilters } from "@/components/history/history-filters";
import { Skeleton } from "@/components/ui/skeleton";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const result = await getHistory({
    category: params.category,
    startDate: params.startDate,
    endDate: params.endDate,
  });

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
        <HistoryList expenses={result.data ?? []} />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
