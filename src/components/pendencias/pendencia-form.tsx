"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  pendenciaSchema,
  type PendenciaFormData,
} from "@/lib/validations/pendencia";
import { createPendencia, updatePendencia } from "@/actions/pendencias";
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
  PRIORITIES,
  URGENCIES,
  COST_CENTERS,
  CURRENCIES,
  CURRENCY_SYMBOLS,
} from "@/lib/constants";
import { Loader2 } from "lucide-react";
import type { Pendencia, SupportedCurrency } from "@/lib/types";

interface PendenciaFormProps {
  pendencia?: Pendencia;
}

export function PendenciaForm({ pendencia }: PendenciaFormProps) {
  const router = useRouter();
  const isEditing = !!pendencia;

  const form = useForm<PendenciaFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(pendenciaSchema) as any,
    defaultValues: {
      name: pendencia?.name ?? "",
      description: pendencia?.description ?? "",
      estimated_amount: pendencia?.estimated_amount ?? undefined,
      currency: pendencia?.currency ?? "BRL",
      category: pendencia?.category ?? "outro",
      cost_center: pendencia?.cost_center ?? "outros",
      priority: pendencia?.priority ?? "medium",
      urgency: pendencia?.urgency ?? "can_wait",
      notes: pendencia?.notes ?? "",
    },
  });

  const watchCurrency = form.watch("currency") as SupportedCurrency;

  async function onSubmit(data: PendenciaFormData) {
    const result = isEditing
      ? await updatePendencia(pendencia.id, data)
      : await createPendencia(data);

    if (result.success) {
      toast.success(
        isEditing ? "Pendência atualizada!" : "Pendência criada!"
      );
      router.push("/pendencias");
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
              <FormLabel>Nome da Pendência</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Dentista Filipe, Portão garagem..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="estimated_amount"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Valor Estimado ({CURRENCY_SYMBOLS[watchCurrency]}) <span className="text-muted-foreground font-normal">— opcional</span></FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Deixe vazio se não souber"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="cost_center"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de Custo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? "outros"}>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                  placeholder="Detalhes da pendência..."
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
            {isEditing ? "Atualizar" : "Criar Pendência"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/pendencias")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
