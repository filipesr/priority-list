"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createOrcamento,
  updateOrcamento,
  addOrcamentoMemberByEmail,
  removeOrcamentoMember,
  updateMemberRole,
} from "@/actions/orcamentos";
import type { OrcamentoWithMembers } from "@/actions/orcamentos";
import type { Profile, OrcamentoRole } from "@/lib/types";

interface OrcamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: OrcamentoWithMembers | null;
  users: (Profile & { email: string })[];
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  editor: "Editor",
  viewer: "Visualizador",
};

export function OrcamentoDialog({
  open,
  onOpenChange,
  orcamento,
  users,
}: OrcamentoDialogProps) {
  const isEditing = !!orcamento;
  const [name, setName] = useState(orcamento?.name ?? "");
  const [isPending, startTransition] = useTransition();

  // Add member state
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<OrcamentoRole>("editor");
  const [addingMember, setAddingMember] = useState(false);

  // Reset form when dialog opens with different orcamento
  const [lastOrcId, setLastOrcId] = useState<string | null>(null);
  if ((orcamento?.id ?? null) !== lastOrcId) {
    setLastOrcId(orcamento?.id ?? null);
    setName(orcamento?.name ?? "");
    setNewEmail("");
    setNewRole("editor");
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    startTransition(async () => {
      if (isEditing) {
        const result = await updateOrcamento(orcamento.id, { name: name.trim() });
        if (result.success) {
          toast.success("Orçamento atualizado");
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createOrcamento({ name: name.trim() });
        if (result.success) {
          toast.success("Orçamento criado");
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  async function handleAddMember() {
    if (!orcamento || !newEmail.trim()) return;

    setAddingMember(true);
    const result = await addOrcamentoMemberByEmail(
      orcamento.id,
      newEmail.trim(),
      newRole
    );

    if (result.success) {
      toast.success("Membro adicionado");
      setNewEmail("");
      setNewRole("editor");
    } else {
      toast.error(result.error);
    }
    setAddingMember(false);
  }

  async function handleRemoveMember(userId: string) {
    if (!orcamento) return;
    if (!confirm("Remover este membro do orçamento?")) return;

    const result = await removeOrcamentoMember(orcamento.id, userId);
    if (result.success) {
      toast.success("Membro removido");
    } else {
      toast.error(result.error);
    }
  }

  async function handleRoleChange(userId: string, role: OrcamentoRole) {
    if (!orcamento) return;

    const result = await updateMemberRole(orcamento.id, userId, role);
    if (result.success) {
      toast.success("Função atualizada");
    } else {
      toast.error(result.error);
    }
  }

  // Find user name by id
  function getMemberName(userId: string): string {
    const member = orcamento?.members.find((m) => m.user_id === userId);
    return member?.profile?.full_name || "Sem nome";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orcamento-name">Nome</Label>
            <Input
              id="orcamento-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Orçamento Familiar"
              maxLength={100}
            />
          </div>

          {isEditing && (
            <div className="space-y-3">
              <Label>Membros</Label>

              {orcamento.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum membro</p>
              ) : (
                <div className="space-y-2">
                  {orcamento.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex flex-wrap items-center gap-2 rounded-md border p-2"
                    >
                      <span className="text-sm min-w-0 flex-1 basis-full sm:basis-0 truncate">
                        {getMemberName(member.user_id)}
                      </span>
                      {member.role === "owner" ? (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {ROLE_LABELS.owner}
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Select
                            value={member.role}
                            onValueChange={(v) =>
                              handleRoleChange(member.user_id, v as OrcamentoRole)
                            }
                          >
                            <SelectTrigger className="h-7 w-[120px] text-xs">
                              <SelectValue
                                items={[
                                  { value: "editor", label: "Editor" },
                                  { value: "viewer", label: "Visualizador" },
                                ]}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor" className="text-xs">
                                Editor
                              </SelectItem>
                              <SelectItem value="viewer" className="text-xs">
                                Visualizador
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive shrink-0"
                            onClick={() => handleRemoveMember(member.user_id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="new-member-email" className="text-xs">
                  Adicionar membro por e-mail
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="new-member-email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    type="email"
                    className="h-8 text-xs min-w-0 flex-1"
                  />
                  <Select
                    value={newRole}
                    onValueChange={(v) => setNewRole(v as OrcamentoRole)}
                  >
                    <SelectTrigger className="h-8 w-[120px] text-xs shrink-0">
                      <SelectValue
                        items={[
                          { value: "editor", label: "Editor" },
                          { value: "viewer", label: "Visualizador" },
                        ]}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor" className="text-xs">
                        Editor
                      </SelectItem>
                      <SelectItem value="viewer" className="text-xs">
                        Visualizador
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0"
                    onClick={handleAddMember}
                    disabled={addingMember || !newEmail.trim()}
                  >
                    {addingMember ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
