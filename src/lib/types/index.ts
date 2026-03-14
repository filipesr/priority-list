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
  Orcamento,
  OrcamentoMember,
  OrcamentoRole,
  LoanDirection,
  LoanStatus,
  LoanMovementType,
  Loan,
  LoanPayment,
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
  recurring?: string;
};

export type PendenciaFilters = {
  status?: string;
  category?: string;
  priority?: string;
  urgency?: string;
  cost_center?: string;
  search?: string;
};

export type LoanFilters = {
  direction?: string;
  status?: string;
  search?: string;
};

import type { Loan } from "./database.types";

export type LoanWithSummary = Loan & {
  total_paid: number;
  current_balance: number;
};

export interface LoanMonthRow {
  month: string;
  balanceBefore: number;
  interest: number;
  payment: number;
  addition: number;
  balanceAfter: number;
}
