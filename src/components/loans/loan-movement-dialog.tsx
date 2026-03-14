"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  loanMovementSchema,
  type LoanMovementFormData,
} from "@/lib/validations/loan";
import { addLoanMovement } from "@/actions/loans";
import { LOAN_MOVEMENT_TYPES, CURRENCY_SYMBOLS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { formatCurrency, convertAmount, type RateMap } from "@/lib/currency";
import type { SupportedCurrency, LoanMovementType } from "@/lib/types";

interface LoanMovementDialogProps {
  loanId: string;
  counterparty: string;
  currentBalance: number;
  currency: SupportedCurrency;
  preferredCurrency: SupportedCurrency;
  rates: RateMap;
}

export function LoanMovementDialog({
  loanId,
  counterparty,
  currentBalance,
  currency,
  preferredCurrency,
  rates,
}: LoanMovementDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<LoanMovementFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loanMovementSchema) as any,
    defaultValues: {
      type: "payment",
      amount: undefined,
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  async function onSubmit(data: LoanMovementFormData) {
    const result = await addLoanMovement(loanId, data);
    if (result.success) {
      const label = data.type === "addition" ? "Aditivo registrado!" : "Pagamento registrado!";
      toast.success(label);
      setOpen(false);
      form.reset();
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Movimentação
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
          <DialogDescription>
            {counterparty} — Saldo atual:{" "}
            {currency !== preferredCurrency
              ? `${formatCurrency(convertAmount(currentBalance, currency, preferredCurrency, rates), preferredCurrency)} (${formatCurrency(currentBalance, currency)})`
              : formatCurrency(currentBalance, currency)}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" items={LOAN_MOVEMENT_TYPES} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOAN_MOVEMENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor ({CURRENCY_SYMBOLS[currency]})</FormLabel>
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
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Textarea placeholder="Notas opcionais..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
