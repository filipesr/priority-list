"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRIORITY_LABELS } from "@/lib/constants";
import type { Expense, PriorityLevel } from "@/lib/types";

const CHART_COLORS: Record<PriorityLevel, string> = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#fbbf24",
  low: "#34d399",
};

export function PriorityChart({ expenses }: { expenses: Expense[] }) {
  const data = (["critical", "high", "medium", "low"] as PriorityLevel[]).map(
    (priority) => {
      const filtered = expenses.filter((e) => e.priority === priority);
      return {
        name: PRIORITY_LABELS[priority],
        count: filtered.length,
        priority,
      };
    }
  );

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Distribuição por Prioridade
          </CardTitle>
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
        <CardTitle className="text-base">
          Distribuição por Prioridade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)" }} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "oklch(0.65 0.02 270)" }} />
            <Tooltip contentStyle={{ backgroundColor: "oklch(0.18 0.012 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: "8px", color: "oklch(0.93 0.01 270)" }} />
            <Bar dataKey="count" name="Quantidade" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.priority}
                  fill={CHART_COLORS[entry.priority]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
