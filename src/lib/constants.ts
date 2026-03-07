import type {
  ExpenseCategory,
  ExpenseType,
  PriorityLevel,
  UrgencyLevel,
  ExpenseStatus,
  RecurrenceFrequency,
} from "@/lib/types";

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  casa: "Casa",
  saude: "Saúde",
  educacao: "Educação",
  viagem: "Viagem",
  pessoais: "Pessoais",
  emergenciais: "Emergenciais",
  outro: "Outro",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  casa: "#818cf8",
  saude: "#f87171",
  educacao: "#a78bfa",
  viagem: "#fbbf24",
  pessoais: "#34d399",
  emergenciais: "#fb7185",
  outro: "#94a3b8",
};

export const TYPE_LABELS: Record<ExpenseType, string> = {
  recorrente: "Recorrente",
  esporadico: "Esporádico",
  imprevisto: "Imprevisto",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const PRIORITY_WEIGHTS: Record<PriorityLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/25",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/25",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  low: "bg-green-500/15 text-green-400 border-green-500/25",
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  urgent: "Urgente",
  can_wait: "Pode Esperar",
  flexible: "Flexível",
};

export const URGENCY_WEIGHTS: Record<UrgencyLevel, number> = {
  urgent: 3,
  can_wait: 2,
  flexible: 1,
};

export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending: "Pendente",
  in_progress: "Em Andamento",
  completed: "Concluída",
};

export const STATUS_COLORS: Record<ExpenseStatus, string> = {
  pending: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  completed: "bg-green-500/15 text-green-400 border-green-500/25",
};

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
};

export const MONTH_LABELS: Record<number, string> = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};

export const RECURRENCE_FREQUENCIES = Object.entries(RECURRENCE_FREQUENCY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const WEEKDAYS = Object.entries(WEEKDAY_LABELS).map(
  ([value, label]) => ({ value: Number(value), label })
);

export const MONTHS = Object.entries(MONTH_LABELS).map(
  ([value, label]) => ({ value: Number(value), label })
);

export const CATEGORIES = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const TYPES = Object.entries(TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const PRIORITIES = Object.entries(PRIORITY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const URGENCIES = Object.entries(URGENCY_LABELS).map(
  ([value, label]) => ({ value, label })
);

export const STATUSES = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);
