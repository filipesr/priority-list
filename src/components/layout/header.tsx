import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";
import { createClient } from "@/lib/supabase/server";
import { getLatestRatesWithMeta } from "@/actions/exchange-rates";
import type { RateMeta } from "@/actions/exchange-rates";
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

  const { rates, meta } = await getLatestRatesWithMeta();

  const others = (["BRL", "USD", "PYG"] as const).filter(c => c !== preferredCurrency);
  const baseAmount = preferredCurrency === "PYG" ? 1000 : 1;
  const baseLabel = `${CURRENCY_SYMBOLS[preferredCurrency]} ${baseAmount === 1000 ? "1.000" : "1"}`;

  const formatRate = (currency: SupportedCurrency, value: number) => {
    if (currency === "PYG") return `${CURRENCY_SYMBOLS[currency]} ${Math.round(value).toLocaleString("pt-BR")}`;
    return `${CURRENCY_SYMBOLS[currency]} ${value.toFixed(2)}`;
  };

  const getSourceTag = (m?: RateMeta) => {
    if (!m) return null;
    const notes = m.notes ?? "";
    const date = new Date(m.effective_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const time = new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    let tag: string;
    let hint: string;
    if (notes.includes("Chaco")) {
      tag = "CC";
      hint = `Câmbios Chaco — ${date} ${time}`;
    } else if (notes.includes("La Moneda")) {
      tag = "LM";
      hint = `La Moneda — ${date} ${time}`;
    } else {
      tag = "IM";
      hint = `Inserido manualmente — ${date} ${time}`;
    }
    return { tag, hint };
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
        {(() => {
          const allMeta = others
            .filter((c) => c !== "USD")
            .map((c) => meta[c])
            .filter(Boolean) as RateMeta[];
          const latest = allMeta.sort((a, b) => b.effective_date.localeCompare(a.effective_date))[0];
          const source = getSourceTag(latest);
          if (!source) return null;
          return (
            <>
              <span
                title={source.hint}
                className="text-[10px] font-medium px-1 py-0.5 rounded bg-muted text-muted-foreground cursor-help"
              >
                {source.tag}
              </span>
              <span className="text-border">|</span>
            </>
          );
        })()}
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
