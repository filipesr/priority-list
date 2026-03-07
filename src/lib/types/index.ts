export type {
  Expense,
  ExpenseCategory,
  ExpenseType,
  ExpenseStatus,
  PriorityLevel,
  UrgencyLevel,
  RecurrenceFrequency,
  Profile,
  Budget,
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
  search?: string;
};
