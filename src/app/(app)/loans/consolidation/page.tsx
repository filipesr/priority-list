import Link from "next/link";
import { getLoansConsolidation, getLoansSummary } from "@/actions/loans";
import { getUserCurrencyAndRates } from "@/actions/exchange-rates";
import { LoanConsolidation } from "@/components/loans/loan-consolidation";
import { LoanSummaryCards } from "@/components/loans/loan-summary-cards";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function LoansConsolidationPage() {
  const [result, summaryResult, { preferredCurrency }] = await Promise.all([
    getLoansConsolidation(),
    getLoansSummary(),
    getUserCurrencyAndRates(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Consolidação por Contraparte</h1>
          <p className="text-muted-foreground">
            Visão agrupada dos empréstimos com parcelas detalhadas
          </p>
        </div>
        <Button variant="outline" render={<Link href="/loans" />}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {summaryResult.success && summaryResult.data && (
        <LoanSummaryCards summary={summaryResult.data} currency={preferredCurrency} />
      )}

      {result.success ? (
        <LoanConsolidation groups={result.data ?? []} currency={preferredCurrency} />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
