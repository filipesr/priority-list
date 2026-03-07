import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import {
  Clock,
  TrendingUp,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import type { DashboardStats } from "@/actions/dashboard";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const balance =
    stats.budgetLimit !== null
      ? stats.budgetLimit - stats.totalCompletedMonth - stats.totalInProgress
      : null;

  const cards = [
    {
      title: "Total Pendente",
      value: formatCurrency(stats.totalPending),
      icon: Clock,
      description: "Aguardando pagamento",
    },
    {
      title: "Comprometido",
      value: formatCurrency(stats.totalInProgress),
      icon: TrendingUp,
      description: "Em andamento",
    },
    {
      title: "Pago no Mês",
      value: formatCurrency(stats.totalCompletedMonth),
      icon: CheckCircle2,
      description: "Concluído este mês",
    },
    {
      title: "Saldo Disponível",
      value: balance !== null ? formatCurrency(balance) : "—",
      icon: Wallet,
      description: balance !== null ? "Restante do orçamento" : "Defina um orçamento",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
