import { z } from "zod/v4";

export const expenseSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  amount: z.number().positive("Valor deve ser maior que zero").max(999999999999, "Valor muito alto"),
  category: z.enum(["casa", "saude", "educacao", "viagem", "pessoais", "emergenciais", "outro"]),
  custom_category: z.string().max(50).optional(),
  type: z.enum(["recorrente", "esporadico", "imprevisto"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  urgency: z.enum(["urgent", "can_wait", "flexible"]),
  due_date: z.string().optional(),
  notes: z.string().max(1000).optional(),
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
  recurrence_day: z.number().int().min(0).max(31).optional(),
  recurrence_month: z.number().int().min(1).max(12).optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
