"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LOAN_DIRECTION_LABELS,
  LOAN_DIRECTION_COLORS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_COLORS,
} from "@/lib/constants";
import { formatCurrency, convertAmount, type RateMap } from "@/lib/currency";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { SensitiveValue } from "@/components/layout/sensitive-value";
import type { CounterpartyGroup } from "@/actions/loans";
import type { SupportedCurrency, LoanDirection, LoanStatus, LoanMonthRow } from "@/lib/types";

interface LoanConsolidationProps {
  groups: CounterpartyGroup[];
  currency: SupportedCurrency;
  rates: RateMap;
}

export function LoanConsolidation({ groups, currency, rates }: LoanConsolidationProps) {
  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-12">
        Nenhum empréstimo encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <CounterpartyCard key={`${group.counterparty}::${group.direction}`} group={group} currency={currency} rates={rates} />
      ))}
    </div>
  );
}

function CounterpartyCard({ group, currency, rates }: { group: CounterpartyGroup; currency: SupportedCurrency; rates: RateMap }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-base">{group.counterparty}</CardTitle>
            <Badge variant="outline" className={LOAN_DIRECTION_COLORS[group.direction as LoanDirection]}>
              {LOAN_DIRECTION_LABELS[group.direction as LoanDirection]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {group.loans.length} empréstimo{group.loans.length > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <div className="text-muted-foreground text-xs">Principal</div>
              <SensitiveValue>{formatCurrency(group.totalPrincipal, currency)}</SensitiveValue>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs">Pago</div>
              <SensitiveValue>{formatCurrency(group.totalPaid, currency)}</SensitiveValue>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs">Saldo</div>
              <div className="font-semibold">
                <SensitiveValue>{formatCurrency(group.totalBalance, currency)}</SensitiveValue>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6 pt-0">
          {group.loans.map((loan) => (
            <LoanBreakdownSection
              key={loan.id}
              loan={loan}
              currency={currency}
              rates={rates}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function LoanBreakdownSection({
  loan,
  currency,
  rates,
}: {
  loan: CounterpartyGroup["loans"][number];
  currency: SupportedCurrency;
  rates: RateMap;
}) {
  const [showAll, setShowAll] = useState(false);
  const rows = loan.monthlyBreakdown;
  const displayRows = showAll ? rows : rows.filter((r) => r.payment > 0 || r.addition > 0);
  const loanCur = (loan.currency ?? "BRL") as SupportedCurrency;
  const showConverted = loanCur !== currency;
  const cv = (amount: number) => convertAmount(amount, loanCur, currency, rates);

  return (
    <div className="space-y-3 border-t border-border/50 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <span className="font-medium text-sm">
              {showConverted
                ? formatCurrency(cv(loan.principal), currency)
                : formatCurrency(loan.principal, currency)}
            </span>
            {showConverted && (
              <span className="text-xs text-muted-foreground ml-1">
                {formatCurrency(loan.principal, loanCur)}
              </span>
            )}
            {loan.interest_rate > 0 && (
              <span className="text-muted-foreground text-xs ml-2">
                {loan.interest_rate}% a.m.
              </span>
            )}
            <span className="text-muted-foreground text-xs ml-2">
              desde {loan.start_date}
            </span>
          </div>
          <Badge variant="outline" className={LOAN_STATUS_COLORS[loan.status as LoanStatus]}>
            {LOAN_STATUS_LABELS[loan.status as LoanStatus]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Simplificada" : "Completa"}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/loans/${loan.id}`} />}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Pago: <span className="text-foreground font-medium">
          {showConverted ? formatCurrency(cv(loan.total_paid), currency) : formatCurrency(loan.total_paid, currency)}
        </span>{showConverted && <span className="ml-1">{formatCurrency(loan.total_paid, loanCur)}</span>}</span>
        <span>Saldo: <span className="text-foreground font-medium">
          {showConverted ? formatCurrency(cv(loan.current_balance), currency) : formatCurrency(loan.current_balance, currency)}
        </span>{showConverted && <span className="ml-1">{formatCurrency(loan.current_balance, loanCur)}</span>}</span>
        {loan.due_date && <span>Vencimento: {loan.due_date}</span>}
      </div>

      {displayRows.length === 0 ? (
        <p className="text-muted-foreground text-xs py-2">
          Nenhuma movimentação registrada. Clique em &quot;Completa&quot; para ver todos os meses.
        </p>
      ) : (
        <MonthlyTable rows={displayRows} currency={currency} showAll={showAll} loanCurrency={loanCur} rates={rates} />
      )}
    </div>
  );
}

function MonthlyTable({
  rows,
  currency,
  showAll,
  loanCurrency,
  rates,
}: {
  rows: LoanMonthRow[];
  currency: SupportedCurrency;
  showAll: boolean;
  loanCurrency: SupportedCurrency;
  rates: RateMap;
}) {
  const showConverted = loanCurrency !== currency;
  const cv = (amount: number) => convertAmount(amount, loanCurrency, currency, rates);

  function Dual({ amount }: { amount: number }) {
    return (
      <>
        <div>{showConverted ? formatCurrency(cv(amount), currency) : formatCurrency(amount, loanCurrency)}</div>
        {showConverted && <div className="text-[10px] text-muted-foreground">{formatCurrency(amount, loanCurrency)}</div>}
      </>
    );
  }

  function DualOpt({ amount }: { amount: number }) {
    if (amount <= 0) return <>{"—"}</>;
    return <Dual amount={amount} />;
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Mês</TableHead>
            <TableHead className="text-xs">Saldo Anterior</TableHead>
            <TableHead className="text-xs">{showAll ? "Juros do Mês" : "Juros Acum."}</TableHead>
            <TableHead className="text-xs">Pagamento</TableHead>
            <TableHead className="text-xs">Aditivo</TableHead>
            <TableHead className="text-xs">Saldo Após</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.month}>
              <TableCell className="text-xs font-medium">{row.month}</TableCell>
              <TableCell className="text-xs"><Dual amount={row.balanceBefore} /></TableCell>
              <TableCell className="text-xs"><DualOpt amount={row.interest} /></TableCell>
              <TableCell className="text-xs"><DualOpt amount={row.payment} /></TableCell>
              <TableCell className="text-xs"><DualOpt amount={row.addition} /></TableCell>
              <TableCell className="text-xs font-medium"><Dual amount={row.balanceAfter} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
