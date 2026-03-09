import { Suspense } from "react";
import {
  getDashboardStats,
  getCategoryBreakdown,
  getCostCenterBreakdown,
  getMonthlySpending,
  getPriorityListExpenses,
} from "@/actions/dashboard";
import type { DashboardPeriod } from "@/actions/dashboard";
import { getLatestRates } from "@/actions/exchange-rates";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { CostCenterChart } from "@/components/dashboard/cost-center-chart";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { MonthlyTrend } from "@/components/dashboard/monthly-trend";
import { PriorityListWidget } from "@/components/dashboard/priority-list";
import { DashboardPeriodFilter } from "@/components/dashboard/period-filter";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;
  const year = params.year ? Number(params.year) : now.getFullYear();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
  const period: DashboardPeriod | undefined = isCurrentMonth ? undefined : { month, year };

  const [statsResult, categoryResult, costCenterResult, monthlyResult, expensesResult, rates] =
    await Promise.all([
      getDashboardStats(period),
      getCategoryBreakdown(period),
      getCostCenterBreakdown(period),
      getMonthlySpending(period),
      getPriorityListExpenses(),
      getLatestRates(),
    ]);

  const currency = statsResult.data?.preferredCurrency ?? "BRL";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas finanças e prioridades
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-8 w-[300px]" />}>
          <DashboardPeriodFilter month={month} year={year} />
        </Suspense>
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
