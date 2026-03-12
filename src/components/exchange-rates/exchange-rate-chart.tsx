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
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import type { ExchangeRate } from "@/lib/types";

interface ExchangeRateChartProps {
  rates: ExchangeRate[];
  month: number;
  year: number;
}

function buildChartData(rates: ExchangeRate[], month: number, year: number) {
  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const endOfMonth = new Date(year, month, 0).toISOString().split("T")[0];

  const recent = rates.filter(
    (r) =>
      (r.currency === "BRL" || r.currency === "PYG") &&
      r.effective_date >= startOfMonth &&
      r.effective_date <= endOfMonth
  );

  // Group by date+currency, keep most recent created_at
  const best = new Map<string, ExchangeRate>();
  for (const r of recent) {
    const key = `${r.effective_date}|${r.currency}`;
    const existing = best.get(key);
    if (!existing || r.created_at > existing.created_at) {
      best.set(key, r);
    }
  }

  // Collect unique dates
  const dateMap = new Map<string, { brl?: number; pyg?: number }>();
  for (const r of best.values()) {
    const entry = dateMap.get(r.effective_date) ?? {};
    if (r.currency === "BRL") entry.brl = r.rate;
    if (r.currency === "PYG") entry.pyg = r.rate;
    dateMap.set(r.effective_date, entry);
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => {
      const [, m, d] = date.split("-");
      return {
        date: `${d}/${m}`,
        brl: vals.brl,
        pyg: vals.pyg,
      };
    });
}

const MONTH_ABBR: Record<number, string> = {
  1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
  7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
};

export function ExchangeRateChart({ rates, month, year }: ExchangeRateChartProps) {
  const data = buildChartData(rates, month, year);
  const title = `Evolução do Câmbio — ${MONTH_ABBR[month]}/${year}`;

  if (data.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Dados insuficientes para o gráfico
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="oklch(1 0 0 / 0.06)"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.65 0.02 270)" }}
            />
            <YAxis
              yAxisId="brl"
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${CURRENCY_SYMBOLS.BRL}${v}`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.65 0.02 270)" }}
            />
            <YAxis
              yAxisId="pyg"
              orientation="right"
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${CURRENCY_SYMBOLS.PYG}${v}`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.65 0.02 270)" }}
            />
            <Tooltip
              formatter={(value, name) => {
                const label = name === "brl" ? "BRL" : "PYG";
                const symbol =
                  CURRENCY_SYMBOLS[label as keyof typeof CURRENCY_SYMBOLS];
                return [
                  `${symbol} ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: label === "PYG" ? 0 : 2, maximumFractionDigits: label === "PYG" ? 0 : 4 })}`,
                  label,
                ];
              }}
              contentStyle={{
                backgroundColor: "oklch(0.18 0.012 270)",
                border: "1px solid oklch(1 0 0 / 0.08)",
                borderRadius: "8px",
                color: "oklch(0.93 0.01 270)",
              }}
            />
            <Line
              yAxisId="brl"
              type="monotone"
              dataKey="brl"
              name="brl"
              stroke="oklch(0.65 0.20 270)"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              yAxisId="pyg"
              type="monotone"
              dataKey="pyg"
              name="pyg"
              stroke="oklch(0.70 0.15 150)"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
