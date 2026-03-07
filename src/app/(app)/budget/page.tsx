import { getBudgetSummary } from "@/actions/budgets";
import { BudgetForm } from "@/components/budget/budget-form";
import { BudgetSummaryCard } from "@/components/budget/budget-summary";

export default async function BudgetPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const result = await getBudgetSummary(month, year);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orçamento</h1>
        <p className="text-muted-foreground">
          Defina e acompanhe seu orçamento mensal
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BudgetForm
          month={month}
          year={year}
          budget={result.data?.budget ?? null}
        />
        {result.success && result.data && (
          <BudgetSummaryCard summary={result.data} />
        )}
      </div>
    </div>
  );
}
