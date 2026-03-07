"use server";

import { createClient } from "@/lib/supabase/server";
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
