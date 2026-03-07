import { pendenciaSchema, type PendenciaFormData } from "@/lib/validations/pendencia";

const FIELD_MAP: Record<string, string> = {
  // PT
  nome: "name",
  valor: "estimated_amount",
  valor_estimado: "estimated_amount",
  categoria: "category",
  prioridade: "priority",
  urgencia: "urgency",
  urgência: "urgency",
  descricao: "description",
  descrição: "description",
  notas: "notes",
  centro_custo: "cost_center",
  centro_de_custo: "cost_center",
  moeda: "currency",
  // EN
  name: "name",
  estimated_amount: "estimated_amount",
  amount: "estimated_amount",
  category: "category",
  priority: "priority",
  urgency: "urgency",
  description: "description",
  notes: "notes",
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

export interface ImportPendenciaResult {
  pendencias: PendenciaFormData[];
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

function rowToPendencia(row: Record<string, unknown>): PendenciaFormData {
  const n = normalizeRow(row);

  const category = CATEGORY_MAP[String(n.category ?? "outro").toLowerCase().trim()] ?? "outro";
  const priority = PRIORITY_MAP[String(n.priority ?? "medium").toLowerCase().trim()] ?? "medium";
  const urgency = URGENCY_MAP[String(n.urgency ?? "can_wait").toLowerCase().trim()] ?? "can_wait";
  const costCenter = COST_CENTER_MAP[String(n.cost_center ?? "outros").toLowerCase().trim()] ?? "outros";
  const currency = CURRENCY_MAP[String(n.currency ?? "brl").toLowerCase().trim()] ?? "BRL";

  const rawAmount = n.estimated_amount;
  const estimatedAmount = rawAmount ? Number(rawAmount) || undefined : undefined;

  return {
    name: String(n.name ?? "").trim(),
    estimated_amount: estimatedAmount && estimatedAmount > 0 ? estimatedAmount : undefined,
    currency: currency as PendenciaFormData["currency"],
    category: category as PendenciaFormData["category"],
    priority: priority as PendenciaFormData["priority"],
    urgency: urgency as PendenciaFormData["urgency"],
    cost_center: costCenter as PendenciaFormData["cost_center"],
    description: String(n.description ?? "").trim() || undefined,
    notes: String(n.notes ?? "").trim() || undefined,
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

export function parseImportPendenciasFile(
  content: string,
  filename: string
): ImportPendenciaResult {
  const ext = filename.toLowerCase().split(".").pop();
  let rows: Record<string, unknown>[];

  if (ext === "json") {
    try {
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return { pendencias: [], errors: [{ row: 0, message: "JSON inválido" }] };
    }
  } else {
    rows = parseCSV(content);
  }

  if (rows.length === 0) {
    return { pendencias: [], errors: [{ row: 0, message: "Arquivo vazio ou sem dados" }] };
  }

  const pendencias: PendenciaFormData[] = [];
  const errors: ImportPendenciaResult["errors"] = [];

  rows.forEach((row, index) => {
    try {
      const data = rowToPendencia(row);
      const result = pendenciaSchema.safeParse(data);
      if (result.success) {
        pendencias.push(result.data);
      } else {
        const msg = result.error.issues.map((i) => i.message).join(", ");
        errors.push({ row: index + 2, message: msg });
      }
    } catch {
      errors.push({ row: index + 2, message: "Erro ao processar linha" });
    }
  });

  return { pendencias, errors };
}
