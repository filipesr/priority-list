import { notFound } from "next/navigation";
import { getLoan, getLoanMonthlyBreakdown } from "@/actions/loans";
import { getUserCurrencyAndRates } from "@/actions/exchange-rates";
import { LoanMovementList } from "@/components/loans/loan-movement-list";
import { LoanMovementDialog } from "@/components/loans/loan-movement-dialog";
import { LoanMonthlyView } from "@/components/loans/loan-monthly-view";
import { Badge } from "@/components/ui/badge";
import {
  LOAN_DIRECTION_LABELS,
  LOAN_DIRECTION_COLORS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_COLORS,
} from "@/lib/constants";
import { formatCurrency, convertAmount } from "@/lib/currency";
import type { SupportedCurrency, LoanDirection, LoanStatus } from "@/lib/types";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, breakdownResult, { preferredCurrency, rates }] = await Promise.all([
    getLoan(id),
    getLoanMonthlyBreakdown(id),
    getUserCurrencyAndRates(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const { loan, payments } = result.data;
  const currency = (loan.currency ?? "BRL") as SupportedCurrency;
  const breakdown = breakdownResult.success ? (breakdownResult.data ?? []) : [];

  const totalPayments = payments
    .filter((p) => (p.type ?? "payment") === "payment")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalAdditions = payments
    .filter((p) => p.type === "addition")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalInterest = breakdown.reduce((sum, r) => sum + r.interest, 0);
  const currentBalance = breakdown.length > 0
    ? breakdown[breakdown.length - 1].balanceAfter
    : loan.principal;

  const showConverted = currency !== preferredCurrency;
  const cv = (amount: number) => convertAmount(amount, currency, preferredCurrency, rates);

  function DualValue({ amount, className, colorClass }: { amount: number; className?: string; colorClass?: string }) {
    return (
      <>
        <span className={colorClass ?? "text-foreground font-medium"}>
          {showConverted
            ? formatCurrency(cv(amount), preferredCurrency)
            : formatCurrency(amount, currency)}
        </span>
        {showConverted && (
          <span className="text-xs text-muted-foreground ml-1">
            {formatCurrency(amount, currency)}
          </span>
        )}
      </>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{loan.counterparty}</h1>
            <Badge variant="outline" className={LOAN_DIRECTION_COLORS[loan.direction as LoanDirection]}>
              {LOAN_DIRECTION_LABELS[loan.direction as LoanDirection]}
            </Badge>
            <Badge variant="outline" className={LOAN_STATUS_COLORS[loan.status as LoanStatus]}>
              {LOAN_STATUS_LABELS[loan.status as LoanStatus]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              Valor Inicial: <DualValue amount={loan.principal} />
            </span>
            {totalAdditions > 0 && (
              <span className="text-muted-foreground">
                Total Aditivos: <DualValue amount={totalAdditions} colorClass="text-purple-400 font-medium" />
              </span>
            )}
            <span className="text-muted-foreground">
              Juros Totais: <DualValue amount={totalInterest} />
            </span>
            {totalPayments > 0 && (
              <span className="text-muted-foreground">
                Total Pago: <DualValue amount={totalPayments} colorClass="text-green-400 font-medium" />
              </span>
            )}
            <span className="text-muted-foreground">
              Saldo Atual: <DualValue amount={currentBalance} colorClass="text-foreground font-semibold" />
            </span>
          </div>
        </div>
        <LoanMovementDialog
          loanId={loan.id}
          counterparty={loan.counterparty}
          currentBalance={currentBalance}
          currency={currency}
          preferredCurrency={preferredCurrency}
          rates={rates}
        />
      </div>

      {/* Monthly breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Visualização Mensal</h2>
        <LoanMonthlyView rows={breakdown} loanCurrency={currency} preferredCurrency={preferredCurrency} rates={rates} />
      </div>

      {/* Movements list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Movimentações</h2>
        <LoanMovementList payments={payments} loanId={loan.id} loanCurrency={currency} preferredCurrency={preferredCurrency} rates={rates} />
      </div>

    </div>
  );
}
