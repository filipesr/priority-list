import { getWidgetExpenses } from "../lib/expenses";
import { getSession } from "../lib/auth";
import { waitForAuthReady } from "../lib/supabase";
import type { Expense } from "../shared/types";

export interface WidgetData {
  expenses: Expense[];
  error?: string;
}

export async function fetchWidgetData(): Promise<WidgetData> {
  // In the headless widget context the Supabase client may not have
  // finished restoring the session from AsyncStorage yet.
  await waitForAuthReady();

  const session = await getSession();
  if (!session) {
    return { expenses: [], error: "Faça login no app" };
  }

  try {
    const expenses = await getWidgetExpenses();
    return { expenses };
  } catch {
    return { expenses: [], error: "Sem conexão" };
  }
}
