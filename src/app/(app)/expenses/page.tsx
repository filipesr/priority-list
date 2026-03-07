import { Suspense } from "react";
import Link from "next/link";
import { getExpenses } from "@/actions/expenses";
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
  const result = await getExpenses({
    status: params.status,
    category: params.category,
    priority: params.priority,
    type: params.type,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <ExpenseList expenses={result.data ?? []} />
      ) : (
        <p className="text-destructive">{result.error}</p>
      )}
    </div>
  );
}
