"use client";

import {
  LineChart,
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
import type { DailyFlowPoint } from "@/actions/dashboard";
import type { SupportedCurrency } from "@/lib/types";

interface DailyFlowChartProps {
  data: DailyFlowPoint[];
  currency?: SupportedCurrency;
}

export function DailyFlowChart({ data, currency = "BRL" }: DailyFlowChartProps) {
  const symbol = CURRENCY_SYMBOLS[currency];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fluxo Diário</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)", fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${symbol}${v}`} axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)", fontSize: 12 }} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{ backgroundColor: "oklch(0.18 0.012 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: "8px", color: "oklch(0.93 0.01 270)" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="planned"
              name="Planejado"
              stroke="oklch(0.75 0.02 270)"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="realized"
              name="Realizado"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pending"
              name="Pendente"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
