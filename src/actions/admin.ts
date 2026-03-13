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

  // We can't join auth.users from client SDK, so we'll use the profile data
  // The email will be fetched separately or stored in profile
  // For now, return profiles with id as email placeholder
  const usersWithEmail = (profiles ?? []).map((p) => ({
    ...p,
    email: "", // Will be populated from auth if needed
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
    .select("full_name")
    .eq("id", userId)
    .single();

  const name = userProfile?.full_name || "Usuário";

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
