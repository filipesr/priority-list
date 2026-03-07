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
import { SensitiveValue } from "@/components/layout/sensitive-value";
import type { DashboardStats } from "@/actions/dashboard";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const c = stats.preferredCurrency;
  const balance = stats.totalIncomeMonth - stats.totalCompletedMonth - stats.totalInProgress;

  const cards = [
    {
      title: "Total Pendente",
      value: formatCurrency(stats.totalPending, c),
      icon: Clock,
      description: "Aguardando pagamento",
      borderColor: "border-l-amber-400",
      iconColor: "text-amber-400",
      sensitive: false,
    },
    {
      title: "Comprometido",
      value: formatCurrency(stats.totalInProgress, c),
      icon: TrendingUp,
      description: "Em andamento",
      borderColor: "border-l-blue-400",
      iconColor: "text-blue-400",
      sensitive: false,
    },
    {
      title: "Pago no Mês",
      value: formatCurrency(stats.totalCompletedMonth, c),
      icon: CheckCircle2,
      description: "Concluído este mês",
      borderColor: "border-l-emerald-400",
      iconColor: "text-emerald-400",
      sensitive: false,
    },
    {
      title: "Saldo Disponível",
      value: formatCurrency(balance, c),
      icon: Wallet,
      description: "Receita - gastos",
      borderColor: "border-l-violet-400",
      iconColor: "text-violet-400",
      sensitive: true,
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
            <div className="text-2xl font-bold">
              {card.sensitive ? (
                <SensitiveValue>{card.value}</SensitiveValue>
              ) : (
                card.value
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
