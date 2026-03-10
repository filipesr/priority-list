"use client";

import {
  BarChart,
  Bar,
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
import type { PriorityBreakdownV2 } from "@/actions/dashboard";
import type { SupportedCurrency } from "@/lib/types";

interface PriorityChartProps {
  data: PriorityBreakdownV2[];
  currency?: SupportedCurrency;
}

export function PriorityChart({ data, currency = "BRL" }: PriorityChartProps) {
  const symbol = CURRENCY_SYMBOLS[currency];

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Distribuição por Prioridade
          </CardTitle>
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
        <CardTitle className="text-base">
          Distribuição por Prioridade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)", fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)", fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{ backgroundColor: "oklch(0.18 0.012 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: "8px", color: "oklch(0.93 0.01 270)" }}
            />
            <Legend />
            <Bar dataKey="planned" name="Planejado" fill="oklch(0.75 0.02 270)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pendente" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realized" name="Realizado" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
