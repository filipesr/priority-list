"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import type { CostCenterBreakdown } from "@/actions/dashboard";
import type { SupportedCurrency } from "@/lib/types";

interface CostCenterChartProps {
  data: CostCenterBreakdown[];
  currency?: SupportedCurrency;
}

export function CostCenterChart({ data, currency = "BRL" }: CostCenterChartProps) {
  const symbol = CURRENCY_SYMBOLS[currency];

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gasto por Centro de Custo</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gasto por Centro de Custo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)" }} />
            <YAxis tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)" }} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{ backgroundColor: "oklch(0.18 0.012 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: "8px", color: "oklch(0.93 0.01 270)" }}
            />
            <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
