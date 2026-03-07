import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "./user-nav";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <header className="flex h-14 items-center gap-4 px-4">
      <SidebarTrigger />
      <div className="flex-1" />
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
