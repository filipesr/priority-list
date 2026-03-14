"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import type { LoanMonthRow, SupportedCurrency } from "@/lib/types";

interface LoanMonthlyViewProps {
  rows: LoanMonthRow[];
  currency: SupportedCurrency;
}

export function LoanMonthlyView({ rows, currency }: LoanMonthlyViewProps) {
  const [showAll, setShowAll] = useState(false);

  const displayRows = showAll ? rows : rows.filter((r) => r.payment > 0 || r.addition > 0);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Nenhum dado mensal disponível.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {showAll ? "Visão Completa" : "Visão Simplificada"}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Simplificada" : "Completa"}
        </Button>
      </div>

      {displayRows.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">
          Nenhuma movimentação registrada. Clique em &quot;Completa&quot; para ver todos os meses.
        </p>
      ) : (
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Saldo Anterior</TableHead>
                <TableHead>{showAll ? "Juros do Mês" : "Juros Acumulados"}</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Aditivo</TableHead>
                <TableHead>Saldo Após</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row) => (
                <TableRow key={row.month}>
                  <TableCell className="font-medium">{row.month}</TableCell>
                  <TableCell>{formatCurrency(row.balanceBefore, currency)}</TableCell>
                  <TableCell>
                    {row.interest > 0 ? formatCurrency(row.interest, currency) : "—"}
                  </TableCell>
                  <TableCell>
                    {row.payment > 0 ? formatCurrency(row.payment, currency) : "—"}
                  </TableCell>
                  <TableCell>
                    {row.addition > 0 ? formatCurrency(row.addition, currency) : "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(row.balanceAfter, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
