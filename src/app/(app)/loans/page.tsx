import { Suspense } from "react";
import Link from "next/link";
import { getLoans, getLoansSummary } from "@/actions/loans";
import { getUserCurrencyAndRates } from "@/actions/exchange-rates";
import { LoanList } from "@/components/loans/loan-list";
import { LoanFilters } from "@/components/loans/loan-filters";
import { LoanSummaryCards } from "@/components/loans/loan-summary-cards";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [result, currencyData] = await Promise.all([
    getLoans({
      direction: params.direction,
      status: params.status,
      search: params.search,
    }),
    getUserCurrencyAndRates(),
  ]);
  const { preferredCurrency, rates } = currencyData;
  const summaryResult = await getLoansSummary(rates, preferredCurrency);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Empréstimos</h1>
          <p className="text-muted-foreground">
            Controle seus empréstimos dados e recebidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/loans/consolidation" />}>
            <Users className="mr-2 h-4 w-4" />
            Consolidação
          </Button>
          <Button render={<Link href="/loans/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Empréstimo
          </Button>
        </div>
      </div>

      {summaryResult.success && summaryResult.data && (
        <LoanSummaryCards summary={summaryResult.data} currency={preferredCurrency} />
      )}

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <LoanFilters />
      </Suspense>

      {result.success ? (
        <LoanList loans={result.data ?? []} preferredCurrency={preferredCurrency} rates={rates} />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
