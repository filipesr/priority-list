export type {
  Expense,
  ExpenseCategory,
  ExpenseType,
  ExpenseStatus,
  PriorityLevel,
  UrgencyLevel,
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
