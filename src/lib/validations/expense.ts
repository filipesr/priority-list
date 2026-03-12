import { z } from "zod/v4";

export const expenseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  amount: z.number().positive("Valor deve ser maior que zero").max(999999999999, "Valor muito alto"),
  currency: z.enum(["BRL", "USD", "PYG"]).default("BRL"),
  category: z.enum(["casa", "saude", "educacao", "viagem", "pessoais", "emergenciais", "outro"]),
  custom_category: z.string().max(50).optional(),
  type: z.enum(["recorrente", "esporadico", "imprevisto"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  urgency: z.enum(["urgent", "can_wait", "flexible"]),
  cost_center: z.enum(["casa", "carro", "filipe", "mayara", "samuel", "ana", "outros"]).default("outros"),
  due_date: z.string().optional(),
  notes: z.string().max(1000).optional(),

  recurrence_frequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
