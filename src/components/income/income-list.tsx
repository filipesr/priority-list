"use client";

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
  CURRENCY_SYMBOLS,
  INCOME_TYPE_LABELS,
  RECURRENCE_FREQUENCY_LABELS,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { SensitiveValue } from "@/components/layout/sensitive-value";
import { Trash2 } from "lucide-react";
import { deleteIncome } from "@/actions/incomes";
import { toast } from "sonner";
import type { Income, IncomeType, SupportedCurrency, RecurrenceFrequency } from "@/lib/types";

interface IncomeListProps {
  incomes: Income[];
}

export function IncomeList({ incomes }: IncomeListProps) {
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta receita?")) return;
    const result = await deleteIncome(id);
    if (result.success) {
      toast.success("Receita excluída");
    } else {
      toast.error(result.error);
    }
  }

  if (incomes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhuma receita cadastrada</p>
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
            <TableHead>Tipo</TableHead>
            <TableHead className="hidden md:table-cell">Recorrência</TableHead>
            <TableHead className="hidden lg:table-cell">Descrição</TableHead>
            <TableHead className="w-[60px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell className="font-medium">{income.name}</TableCell>
              <TableCell>
                <SensitiveValue>
                  {formatCurrency(Number(income.amount), income.currency as SupportedCurrency)}
                </SensitiveValue>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {INCOME_TYPE_LABELS[income.type as IncomeType]}
                </Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {income.is_recurring && income.recurrence_frequency
                  ? RECURRENCE_FREQUENCY_LABELS[
                      income.recurrence_frequency as RecurrenceFrequency
                    ]
                  : "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {income.description || "—"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => handleDelete(income.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
