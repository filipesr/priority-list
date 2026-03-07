import {
  getDashboardStats,
  getCategoryBreakdown,
  getCostCenterBreakdown,
  getMonthlySpending,
  getPriorityListExpenses,
} from "@/actions/dashboard";
import { getLatestRates } from "@/actions/exchange-rates";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { CostCenterChart } from "@/components/dashboard/cost-center-chart";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { PriorityListWidget } from "@/components/dashboard/priority-list";

export default async function DashboardPage() {
  const [statsResult, categoryResult, costCenterResult, monthlyResult, expensesResult, rates] =
    await Promise.all([
      getDashboardStats(),
      getCategoryBreakdown(),
      getCostCenterBreakdown(),
      getMonthlySpending(),
      getPriorityListExpenses(),
      getLatestRates(),
    ]);

  const currency = statsResult.data?.preferredCurrency ?? "BRL";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças e prioridades
        </p>
      </div>

      {statsResult.success && statsResult.data && (
        <StatsCards stats={statsResult.data} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {categoryResult.success && (
          <CategoryChart data={categoryResult.data ?? []} currency={currency} />
        )}
        {expensesResult.success && (
          <PriorityChart expenses={expensesResult.data ?? []} />
        )}
      </div>

      {monthlyResult.success && (
        <MonthlyTrend data={monthlyResult.data ?? []} currency={currency} />
      )}

      {costCenterResult.success && (
        <CostCenterChart data={costCenterResult.data ?? []} currency={currency} />
      )}

      {expensesResult.success && (
        <PriorityListWidget expenses={expensesResult.data ?? []} preferredCurrency={currency} rates={rates} />
      )}
    </div>
  );
}
