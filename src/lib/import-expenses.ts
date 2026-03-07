import { expenseSchema, type ExpenseFormData } from "@/lib/validations/expense";

/**
 * Importação de despesas via arquivo CSV ou JSON.
 *
 * ## Formato CSV
 * Primeira linha = cabeçalho. Separador: vírgula ou ponto-e-vírgula.
 * Colunas obrigatórias: nome, valor
 * Colunas opcionais: categoria, tipo, prioridade, urgencia, vencimento,
 *   descricao, notas, frequencia, dia_recorrencia, mes_recorrencia
 *
 * ### Recorrência
 * Quando tipo = "recorrente", o campo `frequencia` define a periodicidade:
 * - **semanal**: `dia_recorrencia` = dia da semana (0=Domingo ... 6=Sábado)
 * - **mensal** (padrão): `dia_recorrencia` = dia do mês (1-31)
 * - **anual**: `dia_recorrencia` = dia (1-31), `mes_recorrencia` = mês (1-12)
 *
 * Exemplo CSV:
 * ```
 * nome;valor;categoria;tipo;prioridade;urgencia;frequencia;dia_recorrencia;mes_recorrencia
 * Aluguel;2500;casa;recorrente;critical;urgent;mensal;5;
 * Netflix;45;pessoais;recorrente;low;flexible;mensal;15;
 * Feira;200;casa;recorrente;medium;can_wait;semanal;6;
 * IPVA;1800;pessoais;recorrente;high;urgent;anual;15;1
 * Dentista;800;saude;esporadico;high;can_wait;;;
 * ```
 *
 * Exemplo JSON:
 * ```json
 * [
 *   {
 *     "nome": "Aluguel",
 *     "valor": 2500,
 *     "categoria": "casa",
 *     "tipo": "recorrente",
 *     "prioridade": "critical",
 *     "urgencia": "urgent",
 *     "frequencia": "mensal",
 *     "dia_recorrencia": 5
 *   },
 *   {
 *     "nome": "IPVA",
 *     "valor": 1800,
 *     "categoria": "pessoais",
 *     "tipo": "recorrente",
 *     "prioridade": "high",
 *     "urgencia": "urgent",
 *     "frequencia": "anual",
 *     "dia_recorrencia": 15,
 *     "mes_recorrencia": 1
 *   }
 * ]
 * ```
 */

const FIELD_MAP: Record<string, string> = {
  // PT
  nome: "name",
  valor: "amount",
  categoria: "category",
  tipo: "type",
  prioridade: "priority",
  urgencia: "urgency",
  urgência: "urgency",
  vencimento: "due_date",
  descricao: "description",
  descrição: "description",
  notas: "notes",
  frequencia: "recurrence_frequency",
  frequência: "recurrence_frequency",
  dia_recorrencia: "recurrence_day",
  dia_recorrência: "recurrence_day",
  dia: "recurrence_day",
  mes_recorrencia: "recurrence_month",
  mes_recorrência: "recurrence_month",
  mês_recorrência: "recurrence_month",
  mes: "recurrence_month",
  mês: "recurrence_month",
  centro_custo: "cost_center",
  centro_de_custo: "cost_center",
  moeda: "currency",
  // EN
  name: "name",
  amount: "amount",
  category: "category",
  type: "type",
  priority: "priority",
  urgency: "urgency",
  due_date: "due_date",
  description: "description",
  notes: "notes",
  recurrence_frequency: "recurrence_frequency",
  frequency: "recurrence_frequency",
  recurrence_day: "recurrence_day",
  day: "recurrence_day",
  recurrence_month: "recurrence_month",
  month: "recurrence_month",
  cost_center: "cost_center",
  currency: "currency",
};

const CATEGORY_MAP: Record<string, string> = {
  casa: "casa",
  saude: "saude",
  saúde: "saude",
  educacao: "educacao",
  educação: "educacao",
  viagem: "viagem",
  pessoais: "pessoais",
  emergenciais: "emergenciais",
  outro: "outro",
};

const TYPE_MAP: Record<string, string> = {
  recorrente: "recorrente",
  esporadico: "esporadico",
  esporádico: "esporadico",
  imprevisto: "imprevisto",
};

const PRIORITY_MAP: Record<string, string> = {
  critical: "critical",
  critica: "critical",
  crítica: "critical",
  high: "high",
  alta: "high",
  medium: "medium",
  media: "medium",
  média: "medium",
  low: "low",
  baixa: "low",
};

const URGENCY_MAP: Record<string, string> = {
  urgent: "urgent",
  urgente: "urgent",
  can_wait: "can_wait",
  "pode esperar": "can_wait",
  flexible: "flexible",
  flexivel: "flexible",
  flexível: "flexible",
};

const COST_CENTER_MAP: Record<string, string> = {
  casa: "casa",
  carro: "carro",
  filipe: "filipe",
  mayara: "mayara",
  samuel: "samuel",
  ana: "ana",
  outros: "outros",
  outro: "outros",
};

const CURRENCY_MAP: Record<string, string> = {
  brl: "BRL",
  real: "BRL",
  "r$": "BRL",
  usd: "USD",
  dolar: "USD",
  dólar: "USD",
  "us$": "USD",
  pyg: "PYG",
  guarani: "PYG",
  "₲": "PYG",
};

const FREQUENCY_MAP: Record<string, string> = {
  weekly: "weekly",
  semanal: "weekly",
  monthly: "monthly",
  mensal: "monthly",
  yearly: "yearly",
  anual: "yearly",
};

export interface ImportResult {
  expenses: ExpenseFormData[];
  errors: { row: number; message: string }[];
}

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    const mapped = FIELD_MAP[key.toLowerCase().trim()];
    if (mapped) {
      normalized[mapped] = value;
    }
  }
  return normalized;
}

function rowToExpense(row: Record<string, unknown>): ExpenseFormData {
  const n = normalizeRow(row);

  const category = CATEGORY_MAP[String(n.category ?? "outro").toLowerCase().trim()] ?? "outro";
  const type = TYPE_MAP[String(n.type ?? "esporadico").toLowerCase().trim()] ?? "esporadico";
  const priority = PRIORITY_MAP[String(n.priority ?? "medium").toLowerCase().trim()] ?? "medium";
  const urgency = URGENCY_MAP[String(n.urgency ?? "can_wait").toLowerCase().trim()] ?? "can_wait";
  const costCenter = COST_CENTER_MAP[String(n.cost_center ?? "outros").toLowerCase().trim()] ?? "outros";
  const currency = CURRENCY_MAP[String(n.currency ?? "brl").toLowerCase().trim()] ?? "BRL";
  const isRecurring = type === "recorrente";

  const rawFreq = String(n.recurrence_frequency ?? "").toLowerCase().trim();
  const frequency = isRecurring
    ? (FREQUENCY_MAP[rawFreq] ?? "monthly") as ExpenseFormData["recurrence_frequency"]
    : undefined;

  let recurrenceDay: number | undefined;
  let recurrenceMonth: number | undefined;

  if (isRecurring && n.recurrence_day) {
    recurrenceDay = Number(n.recurrence_day);
  }

  if (isRecurring && frequency === "yearly" && n.recurrence_month) {
    recurrenceMonth = Number(n.recurrence_month);
  }

  return {
    name: String(n.name ?? "").trim(),
    amount: Number(n.amount) || 0,
    currency: currency as ExpenseFormData["currency"],
    category: category as ExpenseFormData["category"],
    type: type as ExpenseFormData["type"],
    priority: priority as ExpenseFormData["priority"],
    urgency: urgency as ExpenseFormData["urgency"],
    cost_center: costCenter as ExpenseFormData["cost_center"],
    due_date: isRecurring ? "" : String(n.due_date ?? "").trim(),
    description: String(n.description ?? "").trim() || undefined,
    notes: String(n.notes ?? "").trim() || undefined,
    is_recurring: isRecurring,
    recurrence_frequency: frequency,
    recurrence_day: recurrenceDay,
    recurrence_month: recurrenceMonth,
  };
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const sep = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(sep).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(sep).map((v) => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
}

export function parseImportFile(content: string, filename: string): ImportResult {
  const ext = filename.toLowerCase().split(".").pop();
  let rows: Record<string, unknown>[];

  if (ext === "json") {
    try {
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return { expenses: [], errors: [{ row: 0, message: "JSON inválido" }] };
    }
  } else {
    rows = parseCSV(content);
  }

  if (rows.length === 0) {
    return { expenses: [], errors: [{ row: 0, message: "Arquivo vazio ou sem dados" }] };
  }

  const expenses: ExpenseFormData[] = [];
  const errors: ImportResult["errors"] = [];

  rows.forEach((row, index) => {
    try {
      const data = rowToExpense(row);
      const result = expenseSchema.safeParse(data);
      if (result.success) {
        expenses.push(result.data);
      } else {
        const msg = result.error.issues.map((i) => i.message).join(", ");
        errors.push({ row: index + 2, message: msg });
      }
    } catch {
      errors.push({ row: index + 2, message: "Erro ao processar linha" });
    }
  });

  return { expenses, errors };
}
