import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SensitiveModeProvider } from "@/lib/contexts/sensitive-mode";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preferred_currency, selected_orcamento_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as "BRL" | "USD" | "PYG";
  let selectedOrcamentoId = profile?.selected_orcamento_id as string | null;

  // Fetch user's orcamentos via membership
  const { data: memberships } = await supabase
    .from("orcamento_members")
    .select("role, orcamentos(id, name)")
    .eq("user_id", user.id);

  const orcamentos = (memberships ?? []).map((m: Record<string, unknown>) => {
    const orc = m.orcamentos as { id: string; name: string };
    return { id: orc.id, name: orc.name, role: m.role as string };
  });

  // Auto-select first orcamento if none selected
  if (!selectedOrcamentoId && orcamentos.length > 0) {
    selectedOrcamentoId = orcamentos[0].id;
    await supabase
      .from("profiles")
      .update({ selected_orcamento_id: selectedOrcamentoId })
      .eq("id", user.id);
  }

  // Get selected orcamento details for header
  let orcamentoName: string | null = null;
  let orcamentoCreatorName: string | null = null;
  let orcamentoRole: string | null = null;

  if (selectedOrcamentoId) {
    const { data: orc } = await supabase
      .from("orcamentos")
      .select("name, created_by")
      .eq("id", selectedOrcamentoId)
      .single();

    if (orc) {
      orcamentoName = orc.name;
      if (orc.created_by) {
        const { data: creator } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", orc.created_by)
          .single();
        orcamentoCreatorName = creator?.full_name ?? null;
      }
    }

    // Get user's role in this orcamento
    const match = orcamentos.find((o) => o.id === selectedOrcamentoId);
    orcamentoRole = match?.role ?? null;
  }

  const isViewer = orcamentoRole === "viewer";

  return (
    <SensitiveModeProvider>
      <SidebarProvider>
        <AppSidebar
          isAdmin={isAdmin}
          preferredCurrency={preferredCurrency}
          selectedOrcamentoId={selectedOrcamentoId}
          orcamentos={orcamentos}
        />
        <SidebarInset>
          <Header
            orcamentoName={orcamentoName}
            orcamentoCreatorName={orcamentoCreatorName}
            isViewer={isViewer}
            preferredCurrency={preferredCurrency}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SensitiveModeProvider>
  );
}
