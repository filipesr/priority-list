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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { approveUser, rejectUser, changeUserPassword } from "@/actions/admin";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, KeyRound, Loader2 } from "lucide-react";
import type { Profile } from "@/lib/types";

interface UserListProps {
  users: (Profile & { email: string })[];
}

export function UserList({ users }: UserListProps) {
  const [passwordDialog, setPasswordDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: "", userName: "" });
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove(userId: string) {
    const result = await approveUser(userId);
    if (result.success) {
      toast.success("Usuário aprovado");
    } else {
      toast.error(result.error);
    }
  }

  async function handleReject(userId: string) {
    if (!confirm("Tem certeza que deseja rejeitar este usuário?")) return;
    const result = await rejectUser(userId);
    if (result.success) {
      toast.success("Usuário rejeitado");
    } else {
      toast.error(result.error);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    const result = await changeUserPassword(
      passwordDialog.userId,
      newPassword,
    );
    setLoading(false);

    if (result.success) {
      toast.success("Senha alterada com sucesso");
      setPasswordDialog({ open: false, userId: "", userName: "" });
      setNewPassword("");
    } else {
      toast.error(result.error);
    }
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhum usuário encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Criado em</TableHead>
              <TableHead className="w-[140px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <span className="font-medium">
                      {user.full_name || "Sem nome"}
                    </span>
                    {user.email && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {user.role === "admin" ? "Admin" : "Usuário"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.approved ? "default" : "secondary"}
                    className={
                      user.approved
                        ? "bg-green-500/15 text-green-400 border-green-500/25"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/25"
                    }
                  >
                    {user.approved ? "Aprovado" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(user.created_at), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {!user.approved && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-400 hover:text-green-300"
                        onClick={() => handleApprove(user.id)}
                        title="Aprovar"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {user.role !== "admin" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setPasswordDialog({
                              open: true,
                              userId: user.id,
                              userName: user.full_name || user.email || "Usuário",
                            })
                          }
                          title="Alterar senha"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleReject(user.id)}
                          title="Rejeitar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={passwordDialog.open}
        onOpenChange={(val) => {
          if (!val) {
            setNewPassword("");
            setPasswordDialog({ open: false, userId: "", userName: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Definir nova senha para {passwordDialog.userName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewPassword("");
                  setPasswordDialog({ open: false, userId: "", userName: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || newPassword.length < 6}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
