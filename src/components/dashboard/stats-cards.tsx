import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import {
  ClipboardList,
  CheckCircle2,
  Repeat,
  AlertTriangle,
  Target,
  Wallet,
} from "lucide-react";
import { SensitiveValue } from "@/components/layout/sensitive-value";
import type { DashboardStats } from "@/actions/dashboard";

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const c = stats.preferredCurrency;

  const cards = [
    {
      title: "Despesas Planejadas",
      value: formatCurrency(stats.totalPlanned, c),
      icon: ClipboardList,
      description: "Todas as despesas do período",
      borderColor: "border-l-amber-400",
      iconColor: "text-amber-400",
      sensitive: false,
      subtitle: null as string | null,
    },
    {
      title: "Realizadas",
      value: formatCurrency(stats.totalRealized, c),
      icon: CheckCircle2,
      description: "Concluídas + executado parcial",
      borderColor: "border-l-emerald-400",
      iconColor: "text-emerald-400",
      sensitive: false,
      subtitle: null,
    },
    {
      title: "Recorrentes",
      value: formatCurrency(stats.totalRecurring, c),
      icon: Repeat,
      description: "Despesas recorrentes ativas",
      borderColor: "border-l-cyan-400",
      iconColor: "text-cyan-400",
      sensitive: false,
      subtitle: null,
    },
    {
      title: "Imprevistas",
      value: formatCurrency(stats.totalUnexpected, c),
      icon: AlertTriangle,
      description: "Imprevistos no mês",
      borderColor: "border-l-rose-400",
      iconColor: "text-rose-400",
      sensitive: false,
      subtitle: null,
    },
    {
      title: "Receita",
      value: formatCurrency(stats.totalIncome, c),
      icon: Target,
      description: "Receita total do mês",
      borderColor: "border-l-blue-400",
      iconColor: "text-blue-400",
      sensitive: true,
      subtitle: null,
    },
    {
      title: "Balanço Atual",
      value: formatCurrency(stats.balanceCurrent, c),
      icon: Wallet,
      description: "Receitas - Realizado - Comprometido",
      borderColor: "border-l-violet-400",
      iconColor: "text-violet-400",
      sensitive: true,
      subtitle: `Final: ${formatCurrency(stats.balanceFinal, c)}`,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {card.sensitive ? (
                  <SensitiveValue>{card.subtitle}</SensitiveValue>
                ) : (
                  card.subtitle
                )}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
