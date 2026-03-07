import { z } from "zod/v4";

export const exchangeRateSchema = z.object({
  currency: z.enum(["BRL", "PYG"]),
  rate: z.number().positive("Taxa deve ser maior que zero"),
  effective_date: z.string().min(1, "Data é obrigatória"),
  notes: z.string().max(500).optional(),
});

export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;
