import {
  getDashboardStats,
  getCategoryBreakdown,
  getMonthlySpending,
  getPriorityListExpenses,
} from "@/actions/dashboard";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { PriorityListWidget } from "@/components/dashboard/priority-list";

export default async function DashboardPage() {
  const [statsResult, categoryResult, monthlyResult, expensesResult] =
    await Promise.all([
      getDashboardStats(),
      getCategoryBreakdown(),
      getMonthlySpending(),
      getPriorityListExpenses(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu orçamento e prioridades
        </p>
      </div>

      {statsResult.success && statsResult.data && (
        <StatsCards stats={statsResult.data} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {categoryResult.success && (
          <CategoryChart data={categoryResult.data ?? []} />
        )}
        {expensesResult.success && (
          <PriorityChart expenses={expensesResult.data ?? []} />
        )}
      </div>

      {monthlyResult.success && (
        <MonthlyTrend data={monthlyResult.data ?? []} />
      )}

      {expensesResult.success && (
        <PriorityListWidget expenses={expensesResult.data ?? []} />
      )}
    </div>
  );
}
