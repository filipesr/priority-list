import { getIncomeSummary } from "@/actions/incomes";
import { IncomeForm } from "@/components/income/income-form";
import { IncomeSummary } from "@/components/income/income-summary";
import { IncomeList } from "@/components/income/income-list";

export default async function IncomePage() {
  const result = await getIncomeSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Receitas</h1>
        <p className="text-muted-foreground">
          Gerencie suas fontes de receita
        </p>
      </div>

      {result.success && result.data && (
        <IncomeSummary
          total={result.data.totalInPreferredCurrency}
          currency={result.data.preferredCurrency}
          count={result.data.incomes.length}
        />
      )}

      <IncomeForm />

      {result.success && result.data && (
        <IncomeList incomes={result.data.incomes} />
      )}
    </div>
  );
}
