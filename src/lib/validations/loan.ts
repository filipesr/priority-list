import { z } from "zod/v4";

export const loanSchema = z.object({
  direction: z.enum(["given", "received"]),
  counterparty: z.string().min(1, "Contraparte é obrigatória").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  principal: z.number().positive("Valor deve ser maior que zero").max(999999999999, "Valor muito alto"),
  currency: z.enum(["BRL", "USD", "PYG"]).default("BRL"),
  interest_rate: z.number().min(0, "Taxa não pode ser negativa").max(100, "Taxa máxima 100%").default(0),
  start_date: z.string().min(1, "Data inicial é obrigatória"),
  due_date: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const loanMovementSchema = z.object({
  type: z.enum(["payment", "addition"]).default("payment"),
  amount: z.number().positive("Valor deve ser maior que zero").max(999999999999, "Valor muito alto"),
  payment_date: z.string().min(1, "Data é obrigatória"),
  notes: z.string().max(1000).optional(),
});

export type LoanFormData = z.infer<typeof loanSchema>;
export type LoanMovementFormData = z.infer<typeof loanMovementSchema>;
