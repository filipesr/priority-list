"use client";

import { useTransition } from "react";
import { switchOrcamento } from "@/actions/orcamentos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrcamentoSelectorProps {
  current: string | null;
  orcamentos: { id: string; name: string }[];
}

export function OrcamentoSelector({ current, orcamentos }: OrcamentoSelectorProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(orcamentoId: string | null) {
    if (!orcamentoId || orcamentoId === current) return;
    startTransition(() => {
      switchOrcamento(orcamentoId);
    });
  }

  if (orcamentos.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Nenhum orçamento</p>
    );
  }

  return (
    <Select
      value={current ?? undefined}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue
          placeholder="Selecionar orçamento"
          items={orcamentos.map((o) => ({ value: o.id, label: o.name }))}
        />
      </SelectTrigger>
      <SelectContent>
        {orcamentos.map((orc) => (
          <SelectItem key={orc.id} value={orc.id} className="text-xs">
            {orc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
