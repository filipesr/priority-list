"use client";

import { useState, useTransition } from "react";
import { switchOrcamento, getOrcamento } from "@/actions/orcamentos";
import type { OrcamentoWithMembers } from "@/actions/orcamentos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OrcamentoDialog } from "@/components/admin/orcamento-dialog";
import { Pencil, Eye, Loader2 } from "lucide-react";

interface OrcamentoSelectorProps {
  current: string | null;
  orcamentos: { id: string; name: string }[];
  role?: string;
  isAdmin?: boolean;
}

export function OrcamentoSelector({
  current,
  orcamentos,
  role,
  isAdmin,
}: OrcamentoSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogOrcamento, setDialogOrcamento] = useState<OrcamentoWithMembers | null>(null);
  const [loadingDialog, setLoadingDialog] = useState(false);

  const canEdit = isAdmin || role === "owner";

  function handleChange(orcamentoId: string | null) {
    if (!orcamentoId || orcamentoId === current) return;
    startTransition(() => {
      switchOrcamento(orcamentoId);
    });
  }

  async function handleOpenDialog() {
    if (!current) return;
    setLoadingDialog(true);
    const result = await getOrcamento(current);
    setLoadingDialog(false);
    if (result.success && result.data) {
      setDialogOrcamento(result.data);
      setDialogOpen(true);
    }
  }

  if (orcamentos.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Nenhum orçamento</p>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Select
          value={current ?? undefined}
          onValueChange={handleChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
            <SelectValue
              placeholder="Selecionar orçamento"
              items={orcamentos.map((o) => ({ value: o.id, label: o.name }))}
            />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="w-auto min-w-[var(--anchor-width)]">
            {orcamentos.map((orc) => (
              <SelectItem key={orc.id} value={orc.id} className="text-xs">
                {orc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {current && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleOpenDialog}
            disabled={loadingDialog}
          >
            {loadingDialog ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : canEdit ? (
              <Pencil className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      <OrcamentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orcamento={dialogOrcamento}
        users={[]}
        readOnly={!canEdit}
      />
    </>
  );
}
