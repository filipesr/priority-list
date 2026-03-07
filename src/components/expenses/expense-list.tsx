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
import { PriorityBadge } from "./priority-badge";
import { StatusSelect } from "./status-select";
import { CATEGORY_LABELS, URGENCY_LABELS, COST_CENTER_LABELS } from "@/lib/constants";
import type { CostCenter, SupportedCurrency } from "@/lib/types";
import { formatCurrency, formatConverted } from "@/lib/currency";
import type { RateMap } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { deleteExpense } from "@/actions/expenses";
import { toast } from "sonner";
import type { Expense } from "@/lib/types";

interface ExpenseListProps {
  expenses: Expense[];
  preferredCurrency?: SupportedCurrency;
  rates?: RateMap;
}

export function ExpenseList({
  expenses,
  preferredCurrency = "BRL",
  rates,
}: ExpenseListProps) {
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;
    const result = await deleteExpense(id);
    if (result.success) {
      toast.success("Despesa excluída");
    } else {
      toast.error(result.error);
    }
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhuma despesa encontrada</p>
        <Button className="mt-4" render={<Link href="/expenses/new" />}>
          Criar Despesa
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead className="hidden lg:table-cell">Urgência</TableHead>
            <TableHead className="hidden lg:table-cell">Centro de Custo</TableHead>
            <TableHead className="hidden lg:table-cell">Autor</TableHead>
            <TableHead className="hidden md:table-cell">Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => {
            const expCurrency = (expense.currency ?? "BRL") as SupportedCurrency;
            const showConverted = rates && expCurrency !== preferredCurrency;

            return (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell>
                  <div>{formatCurrency(expense.amount, expCurrency)}</div>
                  {showConverted && (
                    <div className="text-xs text-muted-foreground">
                      {formatConverted(expense.amount, expCurrency, preferredCurrency, rates)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {CATEGORY_LABELS[expense.category]}
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={expense.priority} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {URGENCY_LABELS[expense.urgency]}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {COST_CENTER_LABELS[expense.cost_center as CostCenter] ?? expense.cost_center}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {expense.created_by_name ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {expense.due_date
                    ? format(new Date(expense.due_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusSelect
                    expenseId={expense.id}
                    currentStatus={expense.status}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/expenses/${expense.id}`} />}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(expense.id)}
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
