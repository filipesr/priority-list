import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, COST_CENTER_LABELS } from "@/lib/constants";
import type { CostCenter, SupportedCurrency } from "@/lib/types";
import { formatCurrency, convertAmount, formatConverted } from "@/lib/currency";
import type { RateMap } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Expense } from "@/lib/types";

interface HistoryListProps {
  expenses: Expense[];
  preferredCurrency?: SupportedCurrency;
  rates?: RateMap;
}

export function HistoryList({
  expenses,
  preferredCurrency = "BRL",
  rates,
}: HistoryListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Nenhuma despesa concluída encontrada
        </p>
      </div>
    );
  }

  const defaultRates: RateMap = { BRL: 1, USD: 1, PYG: 1 };
  const r = rates ?? defaultRates;

  const total = expenses.reduce((sum, e) => {
    const expCurrency = (e.currency ?? "BRL") as SupportedCurrency;
    return sum + convertAmount(Number(e.amount), expCurrency, preferredCurrency, r);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {expenses.length} despesa(s) concluída(s)
        </p>
        <p className="font-semibold">
          Total: {formatCurrency(total, preferredCurrency)}
        </p>
      </div>
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead className="hidden lg:table-cell">Centro de Custo</TableHead>
              <TableHead className="hidden lg:table-cell">Autor</TableHead>
              <TableHead>Concluída em</TableHead>
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
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[expense.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {COST_CENTER_LABELS[expense.cost_center as CostCenter] ?? expense.cost_center}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {expense.created_by_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {expense.completed_at
                      ? format(
                          new Date(expense.completed_at),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
