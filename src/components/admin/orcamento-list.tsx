"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteOrcamento } from "@/actions/orcamentos";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { OrcamentoWithMembers } from "@/actions/orcamentos";
import type { Profile } from "@/lib/types";
import { OrcamentoDialog } from "./orcamento-dialog";

interface OrcamentoListProps {
  orcamentos: OrcamentoWithMembers[];
  users: (Profile & { email: string })[];
}

export function OrcamentoList({ orcamentos, users }: OrcamentoListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<OrcamentoWithMembers | null>(null);

  function handleCreate() {
    setEditingOrcamento(null);
    setDialogOpen(true);
  }

  function handleEdit(orc: OrcamentoWithMembers) {
    setEditingOrcamento(orc);
    setDialogOpen(true);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Tem certeza que deseja excluir "${name}"? Todos os dados associados serão perdidos.`)) {
      return;
    }

    const result = await deleteOrcamento(id);
    if (result.success) {
      toast.success("Orçamento excluído");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo Orçamento
        </Button>
      </div>

      {orcamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Criado por</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead className="hidden md:table-cell">Criado em</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orcamentos.map((orc) => (
                <TableRow key={orc.id}>
                  <TableCell className="font-medium">{orc.name}</TableCell>
                  <TableCell>{orc.creator_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{orc.members.length}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(orc.created_at), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(orc)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(orc.id, orc.name)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <OrcamentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orcamento={editingOrcamento}
        users={users}
      />
    </>
  );
}
