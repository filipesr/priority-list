import { notFound } from "next/navigation";
import { getLoan, getLoanMonthlyBreakdown } from "@/actions/loans";
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
import { formatCurrency } from "@/lib/currency";
import type { SupportedCurrency, LoanDirection, LoanStatus } from "@/lib/types";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [result, breakdownResult] = await Promise.all([
    getLoan(id),
    getLoanMonthlyBreakdown(id),
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
              Valor Inicial: <span className="text-foreground font-medium">{formatCurrency(loan.principal, currency)}</span>
            </span>
            {totalAdditions > 0 && (
              <span className="text-muted-foreground">
                Total Aditivos: <span className="text-purple-400 font-medium">{formatCurrency(totalAdditions, currency)}</span>
              </span>
            )}
            <span className="text-muted-foreground">
              Juros Totais: <span className="text-foreground font-medium">{formatCurrency(totalInterest, currency)}</span>
            </span>
            {totalPayments > 0 && (
              <span className="text-muted-foreground">
                Total Pago: <span className="text-green-400 font-medium">{formatCurrency(totalPayments, currency)}</span>
              </span>
            )}
            <span className="text-muted-foreground">
              Saldo Atual: <span className="text-foreground font-semibold">{formatCurrency(currentBalance, currency)}</span>
            </span>
          </div>
        </div>
        <LoanMovementDialog
          loanId={loan.id}
          counterparty={loan.counterparty}
          currentBalance={currentBalance}
          currency={currency}
        />
      </div>

      {/* Monthly breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Visualização Mensal</h2>
        <LoanMonthlyView rows={breakdown} currency={currency} />
      </div>

      {/* Movements list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Movimentações</h2>
        <LoanMovementList payments={payments} loanId={loan.id} currency={currency} />
      </div>

    </div>
  );
}
