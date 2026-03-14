import { supabase } from "./supabase";
import { getSelectedOrcamentoId } from "./auth";
import { computeNextDueDate, formatDateISO } from "../shared/recurrence";
import type { Expense, ExpenseEntry } from "../shared/types";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Fetch expenses for the widget: overdue + next 3 days
 */
export async function getWidgetExpenses(): Promise<Expense[]> {
  const orcamentoId = await getSelectedOrcamentoId();
  if (!orcamentoId) return [];

  const threeDaysFromNow = formatDateISO(addDays(new Date(), 3));

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .neq("status", "completed")
    .not("due_date", "is", null)
    .lte("due_date", threeDaysFromNow)
    .order("due_date", { ascending: true });

  if (error) {
    console.error("getWidgetExpenses error:", error.message);
    return [];
  }

  return (data as Expense[]) ?? [];
}

/**
 * Add an entry to an expense (replicates web addExpenseEntry logic)
 */
export async function addExpenseEntry(
  expenseId: string,
  entry: ExpenseEntry,
): Promise<Expense> {
  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();

  if (fetchError || !expense) {
    throw new Error("Despesa não encontrada");
  }

  const entries: ExpenseEntry[] = [...(expense.expense_entries ?? []), entry];
  const executedAmount = entries.reduce((sum, e) => sum + e.amount, 0);

  const updateData: Record<string, unknown> = {
    expense_entries: entries,
    executed_amount: executedAmount,
  };

  // Auto-adjust amount upward when entries exceed the planned value
  if (executedAmount > expense.amount) {
    updateData.amount = executedAmount;
  }

  const { data: updated, error: updateError } = await supabase
    .from("expenses")
    .update(updateData)
    .eq("id", expenseId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Erro ao adicionar lançamento: ${updateError.message}`);
  }

  return updated as Expense;
}

/**
 * Complete an expense and create next occurrence if recurring
 * (replicates web updateExpenseStatus logic)
 */
export async function completeExpense(expenseId: string): Promise<void> {
  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();

  if (fetchError || !expense) {
    throw new Error("Despesa não encontrada");
  }

  const { error: updateError } = await supabase
    .from("expenses")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", expenseId);

  if (updateError) {
    throw new Error(`Erro ao concluir despesa: ${updateError.message}`);
  }

  // Create next occurrence for recurring expenses
  if (expense.type === "recorrente") {
    const nextDueDate = computeNextDueDate(
      expense.recurrence_frequency,
      expense.due_date,
    );

    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      completed_at: _coa,
      ...rest
    } = expense;

    const { error: insertError } = await supabase.from("expenses").insert({
      ...rest,
      status: "pending",
      completed_at: null,
      due_date: nextDueDate,
      executed_amount: 0,
      expense_entries: [],
    });

    if (insertError) {
      console.error("createNextOccurrence error:", insertError.message);
    }
  }
}

/**
 * Get a single expense by ID
 */
export async function getExpense(expenseId: string): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();

  if (error || !data) {
    throw new Error("Despesa não encontrada");
  }

  return data as Expense;
}
