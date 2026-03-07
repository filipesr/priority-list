"use client";

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
import { approveUser, rejectUser } from "@/actions/admin";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X } from "lucide-react";
import type { Profile } from "@/lib/types";

interface UserListProps {
  users: (Profile & { email: string })[];
}

export function UserList({ users }: UserListProps) {
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

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Nenhum usuário encontrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Criado em</TableHead>
            <TableHead className="w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.full_name || "Sem nome"}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleReject(user.id)}
                      title="Rejeitar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
