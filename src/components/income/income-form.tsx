"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { incomeSchema, type IncomeFormData } from "@/lib/validations/income";
import { createIncome, updateIncome } from "@/actions/incomes";
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
  CURRENCIES,
  INCOME_TYPES,
  RECURRENCE_FREQUENCIES,
  CURRENCY_SYMBOLS,
} from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Income, SupportedCurrency } from "@/lib/types";

interface IncomeFormProps {
  income?: Income;
  onSuccess?: () => void;
}

export function IncomeForm({ income, onSuccess }: IncomeFormProps) {
  const isEditing = !!income;

  const form = useForm<IncomeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(incomeSchema) as any,
    defaultValues: {
      name: income?.name ?? "",
      amount: income?.amount ?? 0,
      currency: income?.currency ?? "BRL",
      type: income?.type ?? "fixed",
      is_recurring: income?.is_recurring ?? false,
      recurrence_frequency: income?.recurrence_frequency ?? undefined,
      description: income?.description ?? "",
      notes: income?.notes ?? "",
    },
  });

  const watchCurrency = form.watch("currency") as SupportedCurrency;
  const watchRecurring = form.watch("is_recurring");

  async function onSubmit(data: IncomeFormData) {
    if (!data.is_recurring) {
      data.recurrence_frequency = undefined;
    }

    const result = isEditing
      ? await updateIncome(income.id, data)
      : await createIncome(data);

    if (result.success) {
      toast.success(isEditing ? "Receita atualizada!" : "Receita criada!");
      if (!isEditing) {
        form.reset();
      }
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEditing ? "Editar Receita" : "Nova Receita"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Salário, Freelance..." {...field} />
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
                  <FormItem>
                    <FormLabel>
                      Valor ({CURRENCY_SYMBOLS[watchCurrency]})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
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
                          <SelectValue placeholder="Selecione" items={CURRENCIES} />
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

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" items={INCOME_TYPES} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INCOME_TYPES.map((t) => (
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

            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="is_recurring"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-border"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Recorrente</FormLabel>
                  </FormItem>
                )}
              />

              {watchRecurring && (
                <FormField
                  control={form.control}
                  name="recurrence_frequency"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? "monthly"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Frequência" items={RECURRENCE_FREQUENCIES} />
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
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da receita..."
                      rows={2}
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
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Atualizar" : "Adicionar Receita"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
