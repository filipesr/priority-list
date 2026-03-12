import { Suspense } from "react";
import Link from "next/link";
import { getExpenses } from "@/actions/expenses";
import { getUserCurrencyAndRates } from "@/actions/exchange-rates";
import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportExpensesDialog } from "@/components/expenses/import-expenses-dialog";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [result, { preferredCurrency, rates }] = await Promise.all([
    getExpenses({
      status: params.status ?? "not_completed",
      category: params.category,
      priority: params.priority,
      type: params.type,
      cost_center: params.cost_center,
      search: params.search,
      period: (params.period as "current_month" | "future" | "all") || "current_month",
      recurring: params.recurring,
    }),
    getUserCurrencyAndRates(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Despesas</h1>
          <p className="text-muted-foreground">
            Gerencie suas despesas e prioridades
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExpensesDialog />
          <Button render={<Link href="/expenses/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ExpenseFilters />
      </Suspense>

      {result.success ? (
        <ExpenseList
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
