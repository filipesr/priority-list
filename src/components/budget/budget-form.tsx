"use client";

import { useState } from "react";
import { upsertBudget } from "@/actions/budgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Budget } from "@/lib/types";

interface BudgetFormProps {
  month: number;
  year: number;
  budget: Budget | null;
}

export function BudgetForm({ month, year, budget }: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [totalLimit, setTotalLimit] = useState(
    budget?.total_limit?.toString() ?? ""
  );
  const [notes, setNotes] = useState(budget?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await upsertBudget(
      month,
      year,
      parseFloat(totalLimit) || 0,
      notes
    );

    if (result.success) {
      toast.success("Orçamento salvo!");
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  }

  const monthName = new Date(year, month - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h3 className="font-semibold capitalize">
        Orçamento de {monthName}
      </h3>
      <div className="space-y-2">
        <Label htmlFor="totalLimit">Limite Mensal (R$)</Label>
        <Input
          id="totalLimit"
          type="number"
          step="0.01"
          min="0"
          value={totalLimit}
          onChange={(e) => setTotalLimit(e.target.value)}
          placeholder="0,00"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas sobre o orçamento..."
          rows={3}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {budget ? "Atualizar" : "Definir"} Orçamento
      </Button>
    </form>
  );
}
