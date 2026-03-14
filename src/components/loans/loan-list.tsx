"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LOAN_DIRECTION_LABELS,
  LOAN_DIRECTION_COLORS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_COLORS,
  CURRENCY_SYMBOLS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { Search, Trash2 } from "lucide-react";
import { deleteLoan } from "@/actions/loans";
import { toast } from "sonner";
import type { LoanWithSummary, SupportedCurrency, LoanDirection, LoanStatus } from "@/lib/types";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { SortableHeader } from "@/components/ui/sortable-header";

interface LoanListProps {
  loans: LoanWithSummary[];
}

export function LoanList({ loans }: LoanListProps) {
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este empréstimo?")) return;
    const result = await deleteLoan(id);
    if (result.success) {
      toast.success("Empréstimo excluído");
    } else {
      toast.error(result.error);
    }
  }

  const { sorted, sortKey, sortDirection, onSort } = useSortableTable(loans);

  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhum empréstimo encontrado</p>
        <Button className="mt-4" render={<Link href="/loans/new" />}>
          Novo Empréstimo
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader label="Contraparte" sortKey="counterparty" active={sortKey === "counterparty"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Direção" sortKey="direction" active={sortKey === "direction"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Principal" sortKey="principal" active={sortKey === "principal"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Juros (%)" sortKey="interest_rate" active={sortKey === "interest_rate"} direction={sortDirection} onSort={onSort} className="hidden md:table-cell" />
            <SortableHeader label="Total Pago" sortKey="total_paid" active={sortKey === "total_paid"} direction={sortDirection} onSort={onSort} className="hidden md:table-cell" />
            <SortableHeader label="Saldo Atual" sortKey="current_balance" active={sortKey === "current_balance"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Vencimento" sortKey="due_date" active={sortKey === "due_date"} direction={sortDirection} onSort={onSort} className="hidden lg:table-cell" />
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((loan) => {
            const cur = (loan.currency ?? "BRL") as SupportedCurrency;
            return (
              <TableRow key={loan.id}>
                <TableCell className="font-medium">{loan.counterparty}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={LOAN_DIRECTION_COLORS[loan.direction as LoanDirection]}>
                    {LOAN_DIRECTION_LABELS[loan.direction as LoanDirection]}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(loan.principal, cur)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {loan.interest_rate > 0 ? `${loan.interest_rate}%` : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {loan.total_paid > 0 ? formatCurrency(loan.total_paid, cur) : "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(loan.current_balance, cur)}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {loan.due_date ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={LOAN_STATUS_COLORS[loan.status as LoanStatus]}>
                    {LOAN_STATUS_LABELS[loan.status as LoanStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8" render={<Link href={`/loans/${loan.id}`} />}>
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 sm:h-8 sm:w-8 text-destructive"
                      onClick={() => handleDelete(loan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
