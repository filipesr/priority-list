import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Expense } from "@/lib/types";

export function HistoryList({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Nenhuma despesa concluída encontrada
        </p>
      </div>
    );
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {expenses.length} despesa(s) concluída(s)
        </p>
        <p className="font-semibold">Total: {formatCurrency(total)}</p>
      </div>
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden md:table-cell">Categoria</TableHead>
              <TableHead>Concluída em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[expense.category]}
                  </Badge>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
