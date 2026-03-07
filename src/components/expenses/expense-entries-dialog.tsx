"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Receipt, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addExpenseEntry, removeExpenseEntry } from "@/actions/expenses";
import { formatCurrency } from "@/lib/currency";
import type { Expense, SupportedCurrency } from "@/lib/types";

interface ExpenseEntriesDialogProps {
  expense: Expense;
  currency: SupportedCurrency;
}

export function ExpenseEntriesDialog({ expense, currency }: ExpenseEntriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    const parsedAmount = parseFloat(amount);
    if (!date || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Informe data e valor válidos");
      return;
    }

    setLoading(true);
    const result = await addExpenseEntry(expense.id, {
      date,
      amount: parsedAmount,
      description: description.trim() || undefined,
    });
    setLoading(false);

    if (result.success) {
      toast.success("Lançamento adicionado");
      setAmount("");
      setDescription("");
    } else {
      toast.error(result.error);
    }
  }

  async function handleRemove(index: number) {
    setLoading(true);
    const result = await removeExpenseEntry(expense.id, index);
    setLoading(false);

    if (result.success) {
      toast.success("Lançamento removido");
    } else {
      toast.error(result.error);
    }
  }

  const entries = expense.expense_entries ?? [];
  const executedAmount = expense.executed_amount ?? 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8" />
        }
      >
        <Receipt className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense.name} — Lançamentos</DialogTitle>
          <DialogDescription>
            Previsto: {formatCurrency(expense.amount, currency)} | Realizado: {formatCurrency(executedAmount, currency)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-shrink-0">
              <label className="text-xs text-muted-foreground">Data</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-[130px]"
              />
            </div>
            <div className="w-[100px] flex-shrink-0">
              <label className="text-xs text-muted-foreground">Valor</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-xs text-muted-foreground">Descrição</label>
              <Input
                type="text"
                placeholder="Opcional"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
              />
            </div>
            <Button
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleAdd}
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {entries.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">
                      {entry.date.split("-").reverse().join("/")}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(entry.amount, currency)}
                    </span>
                    {entry.description && (
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {entry.description}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRemove(index)}
                    disabled={loading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum lançamento registrado
            </p>
          )}

          <div className="flex justify-between items-center border-t border-border/50 pt-3 text-sm">
            <span className="text-muted-foreground">Total realizado</span>
            <span className={`font-semibold ${executedAmount > expense.amount ? "text-destructive" : ""}`}>
              {formatCurrency(executedAmount, currency)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
