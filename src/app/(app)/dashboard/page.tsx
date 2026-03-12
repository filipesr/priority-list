import { Suspense } from "react";
import {
  getDashboardStats,
  getCategoryBreakdown,
  getCostCenterBreakdown,
  getPriorityBreakdown,
  getDailyFlow,
  getTopExpenses,
  getYearlyOverview,
} from "@/actions/dashboard";
import type { DashboardPeriod } from "@/actions/dashboard";
import { getExchangeRates } from "@/actions/exchange-rates";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { CostCenterChart } from "@/components/dashboard/cost-center-chart";
import { PriorityChart } from "@/components/dashboard/priority-chart";
import { DailyFlowChart } from "@/components/dashboard/daily-flow-chart";
import { TopExpensesChart } from "@/components/dashboard/top-expenses-chart";
import { YearlyOverviewChart } from "@/components/dashboard/yearly-overview-chart";
import { ExchangeRateChart } from "@/components/exchange-rates/exchange-rate-chart";
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

  const [statsResult, categoryResult, costCenterResult, priorityResult, dailyFlowResult, topExpensesResult, yearlyOverviewResult, exchangeRatesResult] =
    await Promise.all([
      getDashboardStats(period),
      getCategoryBreakdown(period),
      getCostCenterBreakdown(period),
      getPriorityBreakdown(period),
      getDailyFlow(period),
      getTopExpenses(period),
      getYearlyOverview(year),
      getExchangeRates(),
    ]);

  const currency = statsResult.data?.preferredCurrency ?? "BRL";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="grid gap-6 grid-cols-1 md:grid-cols-6">
        {topExpensesResult.success && (
          <div className="md:col-span-4">
            <TopExpensesChart data={topExpensesResult.data ?? []} currency={currency} />
          </div>
        )}
        {categoryResult.success && (
          <div className="md:col-span-2">
            <CategoryChart data={categoryResult.data ?? []} currency={currency} />
          </div>
        )}
        {priorityResult.success && (
          <div className="md:col-span-2">
            <PriorityChart data={priorityResult.data ?? []} currency={currency} />
          </div>
        )}
        {costCenterResult.success && (
          <div className="md:col-span-2">
            <CostCenterChart data={costCenterResult.data ?? []} currency={currency} />
          </div>
        )}
        {exchangeRatesResult.success && (
          <div className="md:col-span-2">
            <ExchangeRateChart rates={exchangeRatesResult.data ?? []} />
          </div>
        )}
        {dailyFlowResult.success && (
          <div className="md:col-span-2">
            <DailyFlowChart data={dailyFlowResult.data ?? []} currency={currency} />
          </div>
        )}
        {yearlyOverviewResult.success && (
          <div className="md:col-span-4">
            <YearlyOverviewChart
              data={yearlyOverviewResult.data ?? []}
              currency={currency}
              year={year}
            />
          </div>
        )}
      </div>
    </div>
  );
}
