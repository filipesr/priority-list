"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import type { MonthlySpending } from "@/actions/dashboard";
import type { SupportedCurrency } from "@/lib/types";

interface MonthlyTrendProps {
  data: MonthlySpending[];
  currency?: SupportedCurrency;
}

export function MonthlyTrend({ data, currency = "BRL" }: MonthlyTrendProps) {
  const symbol = CURRENCY_SYMBOLS[currency];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tendência Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)" }} />
            <YAxis tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)" }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} contentStyle={{ backgroundColor: "oklch(0.18 0.012 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: "8px", color: "oklch(0.93 0.01 270)" }} />
            <Line
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="oklch(0.65 0.20 270)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
