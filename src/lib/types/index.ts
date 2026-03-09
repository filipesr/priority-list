export type {
  Expense,
  ExpenseEntry,
  ExpenseCategory,
  ExpenseType,
  ExpenseStatus,
  PriorityLevel,
  UrgencyLevel,
  RecurrenceFrequency,
  CostCenter,
  Profile,
  Budget,
  SupportedCurrency,
  IncomeType,
  ExchangeRate,
  Income,
  Pendencia,
  PendenciaStatus,
  PaymentMode,
} from "./database.types";

export type ActionResult<T = null> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ExpenseFilters = {
  status?: string;
  category?: string;
  priority?: string;
  type?: string;
  cost_center?: string;
  search?: string;
  period?: "current_month" | "future" | "all";
};

export type PendenciaFilters = {
  status?: string;
  category?: string;
  priority?: string;
  urgency?: string;
  cost_center?: string;
  search?: string;
};
