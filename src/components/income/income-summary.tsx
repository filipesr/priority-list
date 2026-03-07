import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { SensitiveValue } from "@/components/layout/sensitive-value";
import { TrendingUp } from "lucide-react";
import type { SupportedCurrency } from "@/lib/types";

interface IncomeSummaryProps {
  total: number;
  currency: SupportedCurrency;
  count: number;
}

export function IncomeSummary({ total, currency, count }: IncomeSummaryProps) {
  return (
    <Card className="border-l-2 border-l-emerald-400">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Receita Total
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-emerald-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <SensitiveValue>{formatCurrency(total, currency)}</SensitiveValue>
        </div>
        <p className="text-xs text-muted-foreground">
          {count} receita(s) · Convertido para {CURRENCY_SYMBOLS[currency]}
        </p>
      </CardContent>
    </Card>
  );
}
