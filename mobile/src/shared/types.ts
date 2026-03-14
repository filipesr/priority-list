export type SupportedCurrency = "BRL" | "USD" | "PYG";

export type ExpenseCategory =
  | "casa"
  | "saude"
  | "educacao"
  | "viagem"
  | "pessoais"
  | "emergenciais"
  | "outro";

export type ExpenseType = "recorrente" | "esporadico" | "imprevisto";

export type RecurrenceFrequency = "weekly" | "monthly" | "yearly";

export type PriorityLevel = "critical" | "high" | "medium" | "low";

export type UrgencyLevel = "urgent" | "can_wait" | "flexible";

export type ExpenseStatus = "pending" | "in_progress" | "completed";

export type CostCenter = "casa" | "carro" | "filipe" | "mayara" | "samuel" | "ana" | "outros";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  selected_orcamento_id: string | null;
  role: "admin" | "user";
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseEntry {
  date: string; // "YYYY-MM-DD"
  amount: number;
  description?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  orcamento_id: string;
  name: string;
  description: string | null;
  amount: number;
  executed_amount: number;
  expense_entries: ExpenseEntry[];
  currency: SupportedCurrency;
  category: ExpenseCategory;
  custom_category: string | null;
  type: ExpenseType;
  priority: PriorityLevel;
  urgency: UrgencyLevel;
  status: ExpenseStatus;
  due_date: string | null;
  notes: string | null;
  recurrence_frequency: RecurrenceFrequency | null;
  cost_center: CostCenter;
  created_by_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
