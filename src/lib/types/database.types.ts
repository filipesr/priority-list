export type SupportedCurrency = "BRL" | "USD" | "PYG";

export type IncomeType = "fixed" | "variable";

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
  role: "admin" | "user";
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRate {
  id: string;
  currency: SupportedCurrency;
  rate: number;
  effective_date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: SupportedCurrency;
  type: IncomeType;
  is_recurring: boolean;
  recurrence_frequency: RecurrenceFrequency | null;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseEntry {
  date: string;       // "YYYY-MM-DD"
  amount: number;
  description?: string;
}

export interface Expense {
  id: string;
  user_id: string;
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
  is_recurring: boolean;
  recurrence_frequency: RecurrenceFrequency | null;
  recurrence_day: number | null;
  recurrence_month: number | null;
  cost_center: CostCenter;
  created_by_name: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  total_limit: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PendenciaStatus = "pending" | "resolved";

export type PaymentMode = "single" | "installments";

export interface Pendencia {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  estimated_amount: number | null;
  currency: SupportedCurrency;
  category: ExpenseCategory;
  cost_center: CostCenter;
  urgency: UrgencyLevel;
  priority: PriorityLevel;
  notes: string | null;
  status: PendenciaStatus;
  resolved_at: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
}
