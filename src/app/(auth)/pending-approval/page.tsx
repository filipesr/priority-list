import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";
import { Clock } from "lucide-react";

export default async function PendingApprovalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("approved")
    .eq("id", user.id)
    .single();

  if (profile?.approved) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
        <Clock className="h-8 w-8 text-amber-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Aguardando Aprovação</h1>
        <p className="text-muted-foreground">
          Sua conta está aguardando aprovação do administrador.
        </p>
        <p className="text-sm text-muted-foreground">
          Você receberá acesso assim que sua conta for aprovada.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Conectado como <strong>{user.email}</strong>
      </p>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
