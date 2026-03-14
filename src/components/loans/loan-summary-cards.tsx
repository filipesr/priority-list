import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import {
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
  Wallet,
} from "lucide-react";
import { SensitiveValue } from "@/components/layout/sensitive-value";
import type { LoansSummary } from "@/actions/loans";
import type { SupportedCurrency } from "@/lib/types";

interface LoanSummaryCardsProps {
  summary: LoansSummary;
  currency: SupportedCurrency;
}

export function LoanSummaryCards({ summary, currency }: LoanSummaryCardsProps) {
  const cards = [
    {
      title: "Total Emprestado",
      value: formatCurrency(summary.totalGiven, currency),
      icon: ArrowUpRight,
      description: "Valor que você emprestou",
      borderColor: "border-l-blue-400",
      iconColor: "text-blue-400",
    },
    {
      title: "A Receber",
      value: formatCurrency(summary.totalToReceive, currency),
      icon: HandCoins,
      description: "Saldo devedor de terceiros",
      borderColor: "border-l-emerald-400",
      iconColor: "text-emerald-400",
    },
    {
      title: "Total Pego Emprestado",
      value: formatCurrency(summary.totalReceived, currency),
      icon: ArrowDownLeft,
      description: "Valor que você pegou emprestado",
      borderColor: "border-l-orange-400",
      iconColor: "text-orange-400",
    },
    {
      title: "Devo",
      value: formatCurrency(summary.totalOwed, currency),
      icon: Wallet,
      description: "Seu saldo devedor",
      borderColor: "border-l-rose-400",
      iconColor: "text-rose-400",
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
            <div className="text-xl sm:text-2xl font-bold">
              <SensitiveValue>{card.value}</SensitiveValue>
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
