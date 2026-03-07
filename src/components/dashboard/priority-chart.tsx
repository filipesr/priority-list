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
  critical: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
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
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
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
