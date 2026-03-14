"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResult, Profile } from "@/lib/types";

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin";
}

export async function getUsers(): Promise<ActionResult<(Profile & { email: string })[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  // Check admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: "Erro ao buscar usuários" };
  }

  // Fetch emails from auth using admin client
  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const emailMap = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );

  const usersWithEmail = (profiles ?? []).map((p) => ({
    ...p,
    email: emailMap.get(p.id) ?? "",
  }));

  return { success: true, data: usersWithEmail };
}

export async function approveUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ approved: true })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Erro ao aprovar usuário" };
  }

  // Create personal orcamento for the new user (bypasses RLS)
  const admin = createAdminClient();

  const { data: userProfile } = await admin
    .from("profiles")
    .select("full_name, created_at")
    .eq("id", userId)
    .single();

  const name = userProfile?.full_name || "Usuário";

  // Set default password for Google OAuth users (yymmdd of their created_at)
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const isOAuthOnly =
    authUser?.user?.app_metadata?.provider === "google" &&
    !authUser?.user?.app_metadata?.providers?.includes("email");

  if (isOAuthOnly && userProfile?.created_at) {
    const d = new Date(userProfile.created_at);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    await admin.auth.admin.updateUserById(userId, {
      password: `${yy}${mm}${dd}`,
    });
  }

  const { data: orcamento } = await admin
    .from("orcamentos")
    .insert({ name: `Orçamento de ${name}`, created_by: userId })
    .select("id")
    .single();

  if (orcamento) {
    await admin.from("orcamento_members").insert({
      orcamento_id: orcamento.id,
      user_id: userId,
      role: "owner",
    });

    await admin
      .from("profiles")
      .update({ selected_orcamento_id: orcamento.id })
      .eq("id", userId);
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function rejectUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  // Set approved to false (reject)
  const { error } = await supabase
    .from("profiles")
    .update({ approved: false })
    .eq("id", userId);

  if (error) {
    return { success: false, error: "Erro ao rejeitar usuário" };
  }

  revalidatePath("/admin");
  return { success: true };
}

export async function changeUserPassword(
  userId: string,
  newPassword: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Senha deve ter pelo menos 6 caracteres" };
  }

  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: "Erro ao alterar senha" };
  }

  return { success: true };
}
