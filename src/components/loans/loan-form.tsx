"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  loanSchema,
  type LoanFormData,
} from "@/lib/validations/loan";
import { createLoan, updateLoan } from "@/actions/loans";
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
  CURRENCY_SYMBOLS,
  LOAN_DIRECTIONS,
} from "@/lib/constants";
import { Loader2 } from "lucide-react";
import type { Loan, SupportedCurrency } from "@/lib/types";

interface LoanFormProps {
  loan?: Loan;
}

export function LoanForm({ loan }: LoanFormProps) {
  const router = useRouter();
  const isEditing = !!loan;

  const form = useForm<LoanFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loanSchema) as any,
    defaultValues: {
      direction: loan?.direction ?? "given",
      counterparty: loan?.counterparty ?? "",
      description: loan?.description ?? "",
      principal: loan?.principal ?? undefined,
      currency: loan?.currency ?? "BRL",
      interest_rate: loan?.interest_rate ?? 0,
      start_date: loan?.start_date ?? new Date().toISOString().split("T")[0],
      due_date: loan?.due_date ?? "",
      notes: loan?.notes ?? "",
    },
  });

  const watchCurrency = form.watch("currency") as SupportedCurrency;

  async function onSubmit(data: LoanFormData) {
    const result = isEditing
      ? await updateLoan(loan.id, data)
      : await createLoan(data);

    if (result.success) {
      toast.success(
        isEditing ? "Empréstimo atualizado!" : "Empréstimo criado!"
      );
      router.push("/loans");
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
          name="direction"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Direção</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" items={LOAN_DIRECTIONS} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {LOAN_DIRECTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
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
          name="counterparty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraparte</FormLabel>
              <FormControl>
                <Input placeholder="Nome da pessoa ou empresa..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="principal"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Valor Principal ({CURRENCY_SYMBOLS[watchCurrency]})</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : parseFloat(val) || 0);
                    }}
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

        <FormField
          control={form.control}
          name="interest_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taxa de Juros Mensal (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0"
                  {...field}
                  value={field.value ?? 0}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? 0 : parseFloat(val) || 0);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do Empréstimo</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimento <span className="text-muted-foreground font-normal">— opcional</span></FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
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
                  placeholder="Detalhes do empréstimo..."
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
            {isEditing ? "Atualizar" : "Criar Empréstimo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/loans")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
