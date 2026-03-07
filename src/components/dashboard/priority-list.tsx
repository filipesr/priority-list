import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { calculatePriorityScore, sortByPriority } from "@/lib/priority";
import { CATEGORY_LABELS } from "@/lib/constants";
import { PriorityBadge } from "@/components/expenses/priority-badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Expense } from "@/lib/types";

export function PriorityListWidget({ expenses }: { expenses: Expense[] }) {
  const sorted = sortByPriority(expenses).slice(0, 10);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top 10 - Lista de Prioridades
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            Nenhuma despesa pendente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Top 10 - Lista de Prioridades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map((expense, index) => (
            <Link
              key={expense.id}
              href={`/expenses/${expense.id}`}
              className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{expense.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {CATEGORY_LABELS[expense.category]}
                  </span>
                  {expense.due_date && (
                    <>
                      <span>·</span>
                      <span>
                        {format(new Date(expense.due_date), "dd/MM", {
                          locale: ptBR,
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <PriorityBadge priority={expense.priority} />
              <span className="font-semibold tabular-nums">
                {formatCurrency(expense.amount)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {calculatePriorityScore(expense)}pts
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
