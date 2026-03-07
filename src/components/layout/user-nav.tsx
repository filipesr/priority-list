"use client";

import { useState } from "react";
import { signOut } from "@/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Eye, EyeOff } from "lucide-react";
import { useSensitiveMode } from "@/lib/contexts/sensitive-mode";
import { PasswordDialog } from "./password-dialog";

interface UserNavProps {
  user: {
    email?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  const { isRevealed, reveal, hide } = useSensitiveMode();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? "U";

  function handleToggleValues() {
    if (isRevealed) {
      hide();
    } else {
      setPasswordDialogOpen(true);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="relative h-8 w-8 rounded-full" />
          }
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar_url} alt={user.full_name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {user.full_name && (
                  <p className="text-sm font-medium">{user.full_name}</p>
                )}
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleValues}>
            {isRevealed ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar Valores
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Mostrar Valores
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onSuccess={reveal}
      />
    </>
  );
}
