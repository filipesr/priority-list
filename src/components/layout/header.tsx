import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";
import { createClient } from "@/lib/supabase/server";
import { getLatestRates } from "@/actions/exchange-rates";
import { convertAmount } from "@/lib/currency";
import { CURRENCY_SYMBOLS } from "@/lib/constants";
import type { SupportedCurrency } from "@/lib/types";

interface HeaderProps {
  orcamentoName?: string | null;
  orcamentoCreatorName?: string | null;
  isViewer?: boolean;
  preferredCurrency: SupportedCurrency;
}

export async function Header({ orcamentoName, orcamentoCreatorName, isViewer, preferredCurrency }: HeaderProps) {
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

  const others = (["BRL", "USD", "PYG"] as const).filter(c => c !== preferredCurrency);
  const baseAmount = preferredCurrency === "PYG" ? 1000 : 1;
  const baseLabel = `${CURRENCY_SYMBOLS[preferredCurrency]} ${baseAmount === 1000 ? "1.000" : "1"}`;

  const formatRate = (currency: SupportedCurrency, value: number) => {
    if (currency === "PYG") return `${CURRENCY_SYMBOLS[currency]} ${Math.round(value).toLocaleString("pt-BR")}`;
    return `${CURRENCY_SYMBOLS[currency]} ${value.toFixed(2)}`;
  };

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
        <span>{baseLabel} = {formatRate(others[0], convertAmount(baseAmount, preferredCurrency, others[0], rates))}</span>
        <span className="text-border">|</span>
        <span>{baseLabel} = {formatRate(others[1], convertAmount(baseAmount, preferredCurrency, others[1], rates))}</span>
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
