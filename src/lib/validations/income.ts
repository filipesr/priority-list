import { z } from "zod/v4";

export const incomeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  amount: z.number().positive("Valor deve ser maior que zero"),
  currency: z.enum(["BRL", "USD", "PYG"]).default("BRL"),
  type: z.enum(["fixed", "variable"]),
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export type IncomeFormData = z.infer<typeof incomeSchema>;
