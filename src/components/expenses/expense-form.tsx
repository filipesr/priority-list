"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  expenseSchema,
  type ExpenseFormData,
} from "@/lib/validations/expense";
import { createExpense, updateExpense } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  TYPES,
  PRIORITIES,
  URGENCIES,
  COST_CENTERS,
  RECURRENCE_FREQUENCIES,
  CURRENCIES,
  CURRENCY_SYMBOLS,
  WEEKDAY_LABELS,
  MONTH_LABELS,
} from "@/lib/constants";
import { Loader2 } from "lucide-react";
import type { Expense, SupportedCurrency } from "@/lib/types";

interface ExpenseFormProps {
  expense?: Expense;
}

export function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter();
  const isEditing = !!expense;

  const form = useForm<ExpenseFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      name: expense?.name ?? "",
      description: expense?.description ?? "",
      amount: expense?.amount ?? 0,
      currency: expense?.currency ?? "BRL",
      category: expense?.category ?? "outro",
      custom_category: expense?.custom_category ?? "",
      type: expense?.is_recurring ? "recorrente" : (expense?.type ?? "esporadico"),
      priority: expense?.priority ?? "medium",
      urgency: expense?.urgency ?? "can_wait",
      cost_center: expense?.cost_center ?? "outros",
      due_date: expense?.due_date ?? "",
      notes: expense?.notes ?? "",
      is_recurring: expense?.is_recurring ?? false,
      recurrence_frequency: expense?.recurrence_frequency ?? undefined,
    },
  });

  const watchCurrency = form.watch("currency") as SupportedCurrency;
  const watchType = form.watch("type");
  const isRecurring = watchType === "recorrente";
  const watchFrequency = form.watch("recurrence_frequency");

  function handleTypeChange(value: string, onChange: (value: string) => void) {
    onChange(value);
    if (value === "recorrente") {
      form.setValue("is_recurring", true);
      if (!form.getValues("recurrence_frequency")) {
        form.setValue("recurrence_frequency", "monthly");
      }
    } else {
      form.setValue("is_recurring", false);
      form.setValue("recurrence_frequency", undefined);
    }
  }

  function getRecurrenceLabel(dueDate: string, freq: string | undefined) {
    if (!dueDate || !freq) return null;
    const d = new Date(dueDate + "T00:00:00");
    if (freq === "weekly") {
      return `Toda ${WEEKDAY_LABELS[d.getDay()]?.toLowerCase() ?? ""}`;
    }
    if (freq === "monthly") {
      return `Todo dia ${d.getDate()}`;
    }
    if (freq === "yearly") {
      return `Todo dia ${d.getDate()} de ${MONTH_LABELS[d.getMonth() + 1]?.toLowerCase() ?? ""}`;
    }
    return null;
  }

  const watchDueDate = form.watch("due_date");
  const recurrenceLabel = isRecurring && watchDueDate ? getRecurrenceLabel(watchDueDate, watchFrequency) : null;

  async function onSubmit(data: ExpenseFormData) {
    if (data.type === "recorrente" || data.is_recurring) {
      data.type = "recorrente";
      data.is_recurring = true;
    } else {
      data.is_recurring = false;
      data.recurrence_frequency = undefined;
    }

    const result = isEditing
      ? await updateExpense(expense.id, data)
      : await createExpense(data);

    if (result.success) {
      toast.success(
        isEditing ? "Despesa atualizada!" : "Despesa criada!"
      );
      router.push("/expenses");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-2xl"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Despesa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Aluguel, Conta de luz..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Valor ({CURRENCY_SYMBOLS[watchCurrency]})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moeda</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Moeda" items={CURRENCIES} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" items={CATEGORIES} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={(value) => value && handleTypeChange(value, field.onChange)}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" items={TYPES} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="cost_center"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centro de Custo</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? "outros"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" items={COST_CENTERS} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COST_CENTERS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {isRecurring && (
          <div className="space-y-4 rounded-lg border border-border/50 p-4">
            <FormField
              control={form.control}
              name="recurrence_frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "monthly"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" items={RECURRENCE_FREQUENCIES} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECURRENCE_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  {recurrenceLabel && (
                    <p className="text-sm text-muted-foreground">{recurrenceLabel}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {!isRecurring && (
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Vencimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" items={PRIORITIES} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urgência</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" items={URGENCIES} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {URGENCIES.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalhes da despesa..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas adicionais..." rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Atualizar" : "Criar Despesa"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/expenses")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
