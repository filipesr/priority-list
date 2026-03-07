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

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  amount: number;
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
