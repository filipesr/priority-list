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
    .select("role, preferred_currency")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const preferredCurrency = (profile?.preferred_currency ?? "BRL") as "BRL" | "USD" | "PYG";

  return (
    <SensitiveModeProvider>
      <SidebarProvider>
        <AppSidebar isAdmin={isAdmin} preferredCurrency={preferredCurrency} />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </SensitiveModeProvider>
  );
}
