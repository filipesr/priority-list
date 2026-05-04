import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWidgetExpenses } from "../lib/expenses";
import { getSession } from "../lib/auth";
import { supabase, waitForAuthReady } from "../lib/supabase";
import type { Expense } from "../shared/types";

const CACHE_KEY = "widget_expenses_cache";

export interface WidgetData {
  expenses: Expense[];
  error?: string;
  cached?: boolean;
}

async function saveCache(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(expenses));
  } catch {}
}

async function loadCache(): Promise<Expense[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function fetchWidgetData(): Promise<WidgetData> {
  // In the headless widget context the Supabase client may not have
  // finished restoring the session from AsyncStorage yet.
  await waitForAuthReady();

  const session = await getSession();

  if (session) {
    // Garantir que o access token está atualizado (headless widget
    // não tem o autoRefresh listener ativo)
    const { error: refreshError } = await supabase.auth.refreshSession();

    if (!refreshError) {
      try {
        const expenses = await getWidgetExpenses();
        await saveCache(expenses);
        return { expenses };
      } catch {
        // Erro de rede — tentar cache
        const cached = await loadCache();
        if (cached) return { expenses: cached, cached: true };
        return { expenses: [], error: "Sem conexão" };
      }
    }

    // Refresh falhou (refresh token expirado) — tentar cache
    const cached = await loadCache();
    if (cached) return { expenses: cached, cached: true };
    return { expenses: [], error: "Faça login no app" };
  }

  // Sem sessão — tentar cache como último recurso
  const cached = await loadCache();
  if (cached) return { expenses: cached, cached: true };
  return { expenses: [], error: "Faça login no app" };
}
