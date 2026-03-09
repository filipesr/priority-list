import { z } from "zod";

export const orcamentoSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
});

export type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

export const addMemberSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["owner", "editor", "viewer"]),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;
