import { z } from "zod/v4";

export const pendenciaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  estimated_amount: z.number().positive("Valor deve ser maior que zero").max(999999999999, "Valor muito alto").optional().nullable(),
  currency: z.enum(["BRL", "USD", "PYG"]).default("BRL"),
  category: z.enum(["casa", "saude", "educacao", "viagem", "pessoais", "emergenciais", "outro"]),
  cost_center: z.enum(["casa", "carro", "filipe", "mayara", "samuel", "ana", "outros"]).default("outros"),
  urgency: z.enum(["urgent", "can_wait", "flexible"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  notes: z.string().max(1000).optional(),
});

export const executePendenciaSchema = z.object({
  payment_mode: z.enum(["single", "installments"]),
  amount: z.number().positive("Valor deve ser maior que zero").max(999999999999, "Valor muito alto"),
  currency: z.enum(["BRL", "USD", "PYG"]).default("BRL"),
  installments: z.number().int().min(2, "Mínimo 2 parcelas").max(120, "Máximo 120 parcelas").optional(),
  start_date: z.string().min(1, "Data inicial é obrigatória"),
});

export type PendenciaFormData = z.infer<typeof pendenciaSchema>;
export type ExecutePendenciaFormData = z.infer<typeof executePendenciaSchema>;
