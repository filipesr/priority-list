import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";
import { createClient } from "@/lib/supabase/server";
import { getLatestRates } from "@/actions/exchange-rates";

interface HeaderProps {
  orcamentoName?: string | null;
  orcamentoCreatorName?: string | null;
  isViewer?: boolean;
}

export async function Header({ orcamentoName, orcamentoCreatorName, isViewer }: HeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user?.id ?? "")
    .single();

  if (!profile && user) {
    const meta = user.user_metadata ?? {};
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: meta.full_name ?? meta.name ?? "",
      avatar_url: meta.avatar_url ?? "",
    });
    const { data: created } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = created;
  }

  const rates = await getLatestRates();

  return (
    <header className="flex h-14 items-center gap-4 px-4">
      <SidebarTrigger />
      {orcamentoName && (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm truncate">{orcamentoName}</span>
          {orcamentoCreatorName && (
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">
              por {orcamentoCreatorName}
            </span>
          )}
          {isViewer && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              Somente leitura
            </span>
          )}
        </div>
      )}
      <div className="flex-1" />
      <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
        <span>US$ 1 = R$ {rates.BRL.toFixed(2)}</span>
        <span className="text-border">|</span>
        <span>US$ 1 = ₲ {rates.PYG.toLocaleString("pt-BR")}</span>
      </div>
      <UserNav
        user={{
          email: user?.email,
          full_name: profile?.full_name ?? undefined,
          avatar_url: profile?.avatar_url ?? undefined,
        }}
      />
    </header>
  );
}
