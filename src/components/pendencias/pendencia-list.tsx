"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/expenses/priority-badge";
import { PendenciaStatusBadge } from "./pendencia-status-badge";
import { ExecutePendenciaDialog } from "./execute-pendencia-dialog";
import { CATEGORY_LABELS, URGENCY_LABELS, COST_CENTER_LABELS } from "@/lib/constants";
import type { CostCenter, SupportedCurrency } from "@/lib/types";
import { formatCurrency, formatConverted } from "@/lib/currency";
import type { RateMap } from "@/lib/currency";
import { Pencil, Trash2 } from "lucide-react";
import { deletePendencia } from "@/actions/pendencias";
import { toast } from "sonner";
import type { Pendencia } from "@/lib/types";

interface PendenciaListProps {
  pendencias: Pendencia[];
  preferredCurrency?: SupportedCurrency;
  rates?: RateMap;
}

export function PendenciaList({
  pendencias,
  preferredCurrency = "BRL",
  rates,
}: PendenciaListProps) {
  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta pendência?")) return;
    const result = await deletePendencia(id);
    if (result.success) {
      toast.success("Pendência excluída");
    } else {
      toast.error(result.error);
    }
  }

  if (pendencias.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhuma pendência encontrada</p>
        <Button className="mt-4" render={<Link href="/pendencias/new" />}>
          Criar Pendência
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Valor Estimado</TableHead>
            <TableHead className="hidden md:table-cell">Categoria</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead className="hidden lg:table-cell">Urgência</TableHead>
            <TableHead className="hidden lg:table-cell">Centro de Custo</TableHead>
            <TableHead className="hidden lg:table-cell">Autor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendencias.map((pendencia) => {
            const pendCurrency = (pendencia.currency ?? "BRL") as SupportedCurrency;
            const showConverted = rates && pendencia.estimated_amount && pendCurrency !== preferredCurrency;

            return (
              <TableRow key={pendencia.id}>
                <TableCell className="font-medium">{pendencia.name}</TableCell>
                <TableCell>
                  {pendencia.estimated_amount ? (
                    <>
                      <div>{formatCurrency(pendencia.estimated_amount, pendCurrency)}</div>
                      {showConverted && (
                        <div className="text-xs text-muted-foreground">
                          {formatConverted(pendencia.estimated_amount, pendCurrency, preferredCurrency, rates)}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {CATEGORY_LABELS[pendencia.category]}
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={pendencia.priority} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {URGENCY_LABELS[pendencia.urgency]}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {COST_CENTER_LABELS[pendencia.cost_center as CostCenter] ?? pendencia.cost_center}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {pendencia.created_by_name ?? "—"}
                </TableCell>
                <TableCell>
                  <PendenciaStatusBadge status={pendencia.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {pendencia.status === "pending" && (
                      <ExecutePendenciaDialog pendencia={pendencia} />
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" render={<Link href={`/pendencias/${pendencia.id}`} />}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(pendencia.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
