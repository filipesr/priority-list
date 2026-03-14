"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { deleteLoanMovement } from "@/actions/loans";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatCurrency, convertAmount, type RateMap } from "@/lib/currency";
import {
  LOAN_MOVEMENT_TYPE_LABELS,
  LOAN_MOVEMENT_TYPE_COLORS,
} from "@/lib/constants";
import type { LoanPayment, SupportedCurrency, LoanMovementType } from "@/lib/types";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { SortableHeader } from "@/components/ui/sortable-header";

interface LoanMovementListProps {
  payments: LoanPayment[];
  loanId: string;
  loanCurrency: SupportedCurrency;
  preferredCurrency: SupportedCurrency;
  rates: RateMap;
}

export function LoanMovementList({ payments, loanId, loanCurrency, preferredCurrency, rates }: LoanMovementListProps) {
  const router = useRouter();
  const showConverted = loanCurrency !== preferredCurrency;
  const cv = (amount: number) => convertAmount(amount, loanCurrency, preferredCurrency, rates);

  async function handleDelete(paymentId: string) {
    if (!confirm("Tem certeza que deseja excluir esta movimentação?")) return;
    const result = await deleteLoanMovement(paymentId, loanId);
    if (result.success) {
      toast.success("Movimentação excluída");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  const { sorted, sortKey, sortDirection, onSort } = useSortableTable(payments);

  if (payments.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Nenhuma movimentação registrada.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader label="Data" sortKey="payment_date" active={sortKey === "payment_date"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Tipo" sortKey="type" active={sortKey === "type"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Valor" sortKey="amount" active={sortKey === "amount"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Saldo Restante" sortKey="remaining_balance" active={sortKey === "remaining_balance"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Observações" sortKey="notes" active={sortKey === "notes"} direction={sortDirection} onSort={onSort} className="hidden md:table-cell" />
            <TableCell className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((payment) => {
            const movType = (payment.type ?? "payment") as LoanMovementType;
            return (
              <TableRow key={payment.id}>
                <TableCell>{payment.payment_date}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={LOAN_MOVEMENT_TYPE_COLORS[movType]}>
                    {LOAN_MOVEMENT_TYPE_LABELS[movType]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    {showConverted
                      ? formatCurrency(cv(payment.amount), preferredCurrency)
                      : formatCurrency(payment.amount, loanCurrency)}
                  </div>
                  {showConverted && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(payment.amount, loanCurrency)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    {showConverted
                      ? formatCurrency(cv(payment.remaining_balance), preferredCurrency)
                      : formatCurrency(payment.remaining_balance, loanCurrency)}
                  </div>
                  {showConverted && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(payment.remaining_balance, loanCurrency)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {payment.notes ?? "—"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(payment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
