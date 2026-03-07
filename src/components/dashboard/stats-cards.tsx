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
      borderColor: "border-l-amber-400",
      iconColor: "text-amber-400",
    },
    {
      title: "Comprometido",
      value: formatCurrency(stats.totalInProgress),
      icon: TrendingUp,
      description: "Em andamento",
      borderColor: "border-l-blue-400",
      iconColor: "text-blue-400",
    },
    {
      title: "Pago no Mês",
      value: formatCurrency(stats.totalCompletedMonth),
      icon: CheckCircle2,
      description: "Concluído este mês",
      borderColor: "border-l-emerald-400",
      iconColor: "text-emerald-400",
    },
    {
      title: "Saldo Disponível",
      value: balance !== null ? formatCurrency(balance) : "—",
      icon: Wallet,
      description: balance !== null ? "Restante do orçamento" : "Defina um orçamento",
      borderColor: "border-l-violet-400",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={`border-l-2 ${card.borderColor}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
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
