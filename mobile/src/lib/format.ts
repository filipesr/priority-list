import type { SupportedCurrency } from "../shared/types";

const CURRENCY_CONFIG: Record<SupportedCurrency, { symbol: string; locale: string }> = {
  BRL: { symbol: "R$", locale: "pt-BR" },
  USD: { symbol: "$", locale: "en-US" },
  PYG: { symbol: "₲", locale: "es-PY" },
};

export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  const config = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.BRL;
  return `${config.symbol} ${amount.toLocaleString(config.locale, {
    minimumFractionDigits: currency === "PYG" ? 0 : 2,
    maximumFractionDigits: currency === "PYG" ? 0 : 2,
  })}`;
}

export function getDueDateDisplay(
  dueDate: string | null,
  status?: string,
): {
  label: string;
  color: string;
  isOverdue: boolean;
  isDueToday: boolean;
} {
  if (!dueDate) {
    return { label: "Sem vencimento", color: "#64748b", isOverdue: false, isDueToday: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const formatted = `${due.getDate().toString().padStart(2, "0")}/${(due.getMonth() + 1).toString().padStart(2, "0")}`;

  if (status === "in_progress") {
    return {
      label: `Em andamento (${formatted})`,
      color: "#f59e0b",
      isOverdue: false,
      isDueToday: false,
    };
  }

  if (diffDays < 0) {
    return {
      label: `Vencido: ${formatted}`,
      color: "#ef4444",
      isOverdue: true,
      isDueToday: false,
    };
  }
  if (diffDays === 0) {
    return {
      label: `Vence hoje`,
      color: "#f59e0b",
      isOverdue: false,
      isDueToday: true,
    };
  }
  return {
    label: `Vence: ${formatted}`,
    color: "#94a3b8",
    isOverdue: false,
    isDueToday: false,
  };
}
