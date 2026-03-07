import type {
  ExpenseCategory,
  ExpenseType,
  PriorityLevel,
  UrgencyLevel,
  ExpenseStatus,
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
  casa: "#3b82f6",
  saude: "#ef4444",
  educacao: "#8b5cf6",
  viagem: "#f59e0b",
  pessoais: "#10b981",
  emergenciais: "#dc2626",
  outro: "#6b7280",
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
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
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
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

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
