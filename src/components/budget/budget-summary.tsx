import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BudgetProgress } from "./budget-progress";
import { formatCurrency } from "@/lib/currency";
import type { BudgetSummary as BudgetSummaryType } from "@/actions/budgets";

export function BudgetSummaryCard({
  summary,
}: {
  summary: BudgetSummaryType;
}) {
  if (!summary.budget) {
    return (
      <Card>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            Defina um orçamento mensal para ver o resumo
          </p>
        </CardContent>
      </Card>
    );
  }

  const limit = Number(summary.budget.total_limit);
  const remaining =
    limit - summary.totalSpent - summary.totalCommitted;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo do Orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <BudgetProgress
          label="Gasto (Concluído)"
          value={summary.totalSpent}
          limit={limit}
        />
        <BudgetProgress
          label="Comprometido (Em Andamento)"
          value={summary.totalCommitted}
          limit={limit}
        />
        <BudgetProgress
          label="Total Utilizado"
          value={summary.totalSpent + summary.totalCommitted}
          limit={limit}
        />
        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
          <span className="font-medium">Disponível</span>
          <span
            className={`text-xl font-bold ${
              remaining < 0 ? "text-destructive" : "text-green-600"
            }`}
          >
            {formatCurrency(remaining)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Pendente (não comprometido): {formatCurrency(summary.totalPending)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
