"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlayCircle, Loader2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  executePendenciaSchema,
  type ExecutePendenciaFormData,
} from "@/lib/validations/pendencia";
import { executePendencia } from "@/actions/pendencias";
import { PAYMENT_MODES, CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import type { Pendencia, SupportedCurrency } from "@/lib/types";

interface ExecutePendenciaDialogProps {
  pendencia: Pendencia;
}

export function ExecutePendenciaDialog({ pendencia }: ExecutePendenciaDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<ExecutePendenciaFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(executePendenciaSchema) as any,
    defaultValues: {
      payment_mode: "single",
      amount: pendencia.estimated_amount ?? 0,
      currency: pendencia.currency ?? "BRL",
      installments: undefined,
      start_date: new Date().toISOString().split("T")[0],
    },
  });

  const watchMode = form.watch("payment_mode");
  const watchAmount = form.watch("amount");
  const watchCurrency = form.watch("currency") as SupportedCurrency;
  const watchInstallments = form.watch("installments");
  const watchStartDate = form.watch("start_date");

  function getPreview() {
    if (!watchAmount || watchAmount <= 0) return null;

    if (watchMode === "single") {
      return `1 despesa de ${formatCurrency(watchAmount, watchCurrency)}`;
    }

    const n = watchInstallments ?? 2;
    const installmentAmount = Math.round((watchAmount / n) * 100) / 100;
    const firstDate = watchStartDate ? new Date(watchStartDate) : new Date();
    const lastDate = addMonths(firstDate, n - 1);

    return `${n} parcelas de ${formatCurrency(installmentAmount, watchCurrency)}, primeira em ${format(firstDate, "dd/MM/yyyy", { locale: ptBR })}, última em ${format(lastDate, "dd/MM/yyyy", { locale: ptBR })}`;
  }

  async function onSubmit(data: ExecutePendenciaFormData) {
    const result = await executePendencia(pendencia.id, data);
    if (result.success) {
      toast.success("Pendência executada! Despesa(s) criada(s).");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400" />}>
        <PlayCircle className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Executar Pendência</DialogTitle>
          <DialogDescription>
            Transformar &quot;{pendencia.name}&quot; em despesa(s).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="payment_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Valor Total ({CURRENCY_SYMBOLS[watchCurrency]})</FormLabel>
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
                          <SelectValue placeholder="Moeda" />
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

            {watchMode === "installments" && (
              <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={120}
                        placeholder="Ex: 10"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Inicial</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {getPreview() && (
              <div className="rounded-lg border border-border/50 bg-accent/50 p-3 text-sm">
                {getPreview()}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Executar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
