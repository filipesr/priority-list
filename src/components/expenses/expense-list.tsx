"use client";

import { useMemo } from "react";
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
import { CATEGORY_LABELS, URGENCY_LABELS, COST_CENTER_LABELS, PRIORITY_RANK } from "@/lib/constants";
import type { CostCenter, SupportedCurrency } from "@/lib/types";
import { formatCurrency, convertAmount } from "@/lib/currency";
import type { RateMap } from "@/lib/currency";
import { format, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { ExpenseEntriesDialog } from "./expense-entries-dialog";
import { PostponeExpenseDialog } from "./postpone-expense-dialog";
import { deleteExpense, convertExpenseToPendencia } from "@/actions/expenses";
import { toast } from "sonner";
import type { Expense } from "@/lib/types";
import { useSortableTable } from "@/hooks/use-sortable-table";
import { SortableHeader } from "@/components/ui/sortable-header";

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

  async function handleConvertToPendencia(id: string) {
    if (!confirm("Converter esta despesa em pendência? A despesa será removida.")) return;
    const result = await convertExpenseToPendencia(id);
    if (result.success) {
      toast.success("Despesa convertida em pendência");
    } else {
      toast.error(result.error);
    }
  }

  const valueGetters = useMemo(() => ({
    amount: (e: Expense) => {
      if (!rates) return e.amount;
      const cur = (e.currency ?? "BRL") as SupportedCurrency;
      return cur === preferredCurrency
        ? e.amount
        : convertAmount(e.amount, cur, preferredCurrency, rates);
    },
    due_date: (e: Expense) => e.due_date ?? null,
    priority: (e: Expense) => PRIORITY_RANK[e.priority] ?? 99,
  }), [rates, preferredCurrency]);

  const { sorted, sortKey, sortDirection, onSort } = useSortableTable(expenses, "due_date", "asc", valueGetters);

  const total = useMemo(() => {
    if (!rates) return expenses.reduce((sum, e) => sum + e.amount, 0);
    return expenses.reduce((sum, e) => {
      const cur = (e.currency ?? "BRL") as SupportedCurrency;
      return sum + convertAmount(e.amount, cur, preferredCurrency, rates);
    }, 0);
  }, [expenses, rates, preferredCurrency]);

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
    <div className="space-y-2">
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader label="Vencimento" sortKey="due_date" active={sortKey === "due_date"} direction={sortDirection} onSort={onSort} className="hidden md:table-cell" />
            <SortableHeader label="Nome" sortKey="name" active={sortKey === "name"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Valor" sortKey="amount" active={sortKey === "amount"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Categoria" sortKey="category" active={sortKey === "category"} direction={sortDirection} onSort={onSort} className="hidden md:table-cell" />
            <SortableHeader label="Prioridade" sortKey="priority" active={sortKey === "priority"} direction={sortDirection} onSort={onSort} />
            <SortableHeader label="Urgência" sortKey="urgency" active={sortKey === "urgency"} direction={sortDirection} onSort={onSort} className="hidden lg:table-cell" />
            <SortableHeader label="Centro de Custo" sortKey="cost_center" active={sortKey === "cost_center"} direction={sortDirection} onSort={onSort} className="hidden lg:table-cell" />
            <TableHead className="hidden lg:table-cell">Autor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((expense) => {
            const expCurrency = (expense.currency ?? "BRL") as SupportedCurrency;
            const showConverted = rates && expCurrency !== preferredCurrency;

            return (
              <TableRow key={expense.id}>
                <TableCell className="hidden md:table-cell">
                  {(() => {
                    const today = startOfDay(new Date());
                    const due = expense.due_date ? startOfDay(new Date(expense.due_date + "T00:00:00")) : null;

                    if (!due) return "—";

                    const daysLeft = differenceInDays(due, today);
                    const isCompleted = expense.status === "completed";

                    let dueText: string;
                    let dueColor: string;

                    if (daysLeft < 0) {
                      dueText = `Vencido há ${Math.abs(daysLeft)} dia(s)`;
                      dueColor = isCompleted ? "text-muted-foreground" : "text-destructive";
                    } else if (daysLeft === 0) {
                      dueText = "Vence hoje";
                      dueColor = isCompleted ? "text-muted-foreground" : "text-orange-500";
                    } else if (daysLeft <= 7) {
                      dueText = `Vence em ${daysLeft} dia(s)`;
                      dueColor = isCompleted ? "text-muted-foreground" : "text-orange-500";
                    } else {
                      dueText = `Vence em ${daysLeft} dias`;
                      dueColor = "text-muted-foreground";
                    }

                    return (
                      <div>
                        <div>{format(due, "dd/MM/yyyy", { locale: ptBR })}</div>
                        <div className={`text-xs ${dueColor}`}>{dueText}</div>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell>
                  <div>
                    {showConverted
                      ? formatCurrency(convertAmount(expense.amount, expCurrency, preferredCurrency, rates!), preferredCurrency)
                      : formatCurrency(expense.amount, expCurrency)}
                  </div>
                  {showConverted && (
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(expense.amount, expCurrency)}
                    </div>
                  )}
                  {(expense.executed_amount ?? 0) > 0 && (
                    <div className={`text-xs ${
                      expense.executed_amount > expense.amount
                        ? "text-destructive"
                        : "text-orange-500"
                    }`}>
                      Realizado: {showConverted
                        ? formatCurrency(convertAmount(expense.executed_amount, expCurrency, preferredCurrency, rates!), preferredCurrency)
                        : formatCurrency(expense.executed_amount, expCurrency)}
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
                <TableCell>
                  <StatusSelect
                    expenseId={expense.id}
                    currentStatus={expense.status}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <ExpenseEntriesDialog expense={expense} currency={expCurrency} />
                    <PostponeExpenseDialog expenseId={expense.id} currentDueDate={expense.due_date} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleConvertToPendencia(expense.id)}
                      title="Converter em pendência"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
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
    <div className="flex justify-end rounded-md border border-border/50 px-4 py-3">
      <span className="text-sm font-medium">
        Total: {formatCurrency(total, preferredCurrency)}
      </span>
    </div>
    </div>
  );
}
