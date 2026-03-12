"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import { useSensitiveMode } from "@/lib/contexts/sensitive-mode";
import { Lock } from "lucide-react";
import type { YearlyOverviewPoint } from "@/actions/dashboard";
import type { SupportedCurrency } from "@/lib/types";

interface YearlyOverviewChartProps {
  data: YearlyOverviewPoint[];
  currency?: SupportedCurrency;
  year: number;
}

export function YearlyOverviewChart({ data, currency = "BRL", year }: YearlyOverviewChartProps) {
  const symbol = CURRENCY_SYMBOLS[currency];
  const { isRevealed } = useSensitiveMode();

  const hasData = data.some((d) => d.planned > 0 || d.realized > 0 || d.revenue > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visão Anual — {year}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] sm:h-[300px] items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Visão Anual — {year}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className={`h-[250px] sm:h-[300px] transition-all duration-300 ${!isRevealed ? "blur-md select-none" : ""}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.65 0.02 270)", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v) => `${symbol}${v}`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.65 0.02 270)", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
                contentStyle={{
                  backgroundColor: "oklch(0.18 0.012 270)",
                  border: "1px solid oklch(1 0 0 / 0.08)",
                  borderRadius: "8px",
                  color: "oklch(0.93 0.01 270)",
                }}
              />
              <Legend />
              <Bar dataKey="planned" name="Planejado" fill="oklch(0.75 0.02 270)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="realized" name="Realizado" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="revenue" name="Receita" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="balance" name="Saldo" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {!isRevealed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <Lock className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">Dados sensíveis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
