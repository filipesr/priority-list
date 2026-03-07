"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import type { CategoryBreakdown } from "@/actions/dashboard";
import type { SupportedCurrency } from "@/lib/types";

interface CategoryChartProps {
  data: CategoryBreakdown[];
  currency?: SupportedCurrency;
}

export function CategoryChart({ data, currency = "BRL" }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos por Categoria</CardTitle>
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
        <CardTitle className="text-base">Gastos por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="total"
              nameKey="label"
              label={(props: PieLabelRenderProps) => {
                const { x, y, name, percent } = props;
                return (
                  <text x={x as number} y={y as number} fill="oklch(0.75 0.02 270)" textAnchor={(x as number) > 200 ? "start" : "end"} dominantBaseline="central" fontSize={12}>
                    {`${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{ backgroundColor: "oklch(0.18 0.012 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: "8px", color: "oklch(0.93 0.01 270)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
