"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult, Orcamento, OrcamentoMember, OrcamentoRole } from "@/lib/types";
import { orcamentoSchema, type OrcamentoFormData } from "@/lib/validations/orcamento";

// ---------------------------------------------------------------------------
// Helper: get selected orcamento id for current user
// ---------------------------------------------------------------------------
export async function getSelectedOrcamentoId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("selected_orcamento_id")
    .eq("id", user.id)
    .single();

  return profile?.selected_orcamento_id ?? null;
}

// ---------------------------------------------------------------------------
// Helper: get current user's role in the selected orcamento
// ---------------------------------------------------------------------------
export async function getSelectedOrcamentoRole(): Promise<OrcamentoRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const orcamentoId = await getSelectedOrcamentoId();
  if (!orcamentoId) return null;

  const { data: member } = await supabase
    .from("orcamento_members")
    .select("role")
    .eq("orcamento_id", orcamentoId)
    .eq("user_id", user.id)
    .single();

  return (member?.role as OrcamentoRole) ?? null;
}

// ---------------------------------------------------------------------------
// Read: user's orcamentos (via membership)
// ---------------------------------------------------------------------------
export async function getUserOrcamentos(): Promise<
  ActionResult<{ id: string; name: string; role: string }[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data, error } = await supabase
    .from("orcamento_members")
    .select("role, orcamentos(id, name)")
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: `Erro ao buscar orçamentos: ${error.message}` };
  }

  const orcamentos = (data ?? []).map((m: Record<string, unknown>) => {
    const orc = m.orcamentos as { id: string; name: string };
    return { id: orc.id, name: orc.name, role: m.role as string };
  });

  return { success: true, data: orcamentos };
}

// ---------------------------------------------------------------------------
// Read: all orcamentos with members (admin only)
// ---------------------------------------------------------------------------
export interface OrcamentoWithMembers extends Orcamento {
  members: (OrcamentoMember & { profile?: { full_name: string | null; email?: string } })[];
  creator_name?: string | null;
}

export async function getAllOrcamentos(): Promise<ActionResult<OrcamentoWithMembers[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { data: orcamentos, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: `Erro ao buscar orçamentos: ${error.message}` };
  }

  const result: OrcamentoWithMembers[] = [];

  for (const orc of orcamentos ?? []) {
    // Fetch members
    const { data: members } = await supabase
      .from("orcamento_members")
      .select("*")
      .eq("orcamento_id", orc.id);

    // Fetch profiles for members
    const membersWithProfiles = [];
    for (const member of members ?? []) {
      const { data: memberProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", member.user_id)
        .single();

      // Fetch email from auth (via admin API or profiles)
      membersWithProfiles.push({
        ...member,
        profile: { full_name: memberProfile?.full_name ?? null },
      });
    }

    // Creator name
    let creatorName: string | null = null;
    if (orc.created_by) {
      const { data: creator } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", orc.created_by)
        .single();
      creatorName = creator?.full_name ?? null;
    }

    result.push({
      ...orc,
      members: membersWithProfiles,
      creator_name: creatorName,
    });
  }

  return { success: true, data: result };
}

// ---------------------------------------------------------------------------
// Read: single orcamento with members
// ---------------------------------------------------------------------------
export async function getOrcamento(
  id: string
): Promise<ActionResult<OrcamentoWithMembers>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: orc, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !orc) {
    return { success: false, error: "Orçamento não encontrado" };
  }

  const { data: members } = await supabase
    .from("orcamento_members")
    .select("*")
    .eq("orcamento_id", id);

  const membersWithProfiles = [];
  for (const member of members ?? []) {
    const { data: memberProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", member.user_id)
      .single();
    membersWithProfiles.push({
      ...member,
      profile: { full_name: memberProfile?.full_name ?? null },
    });
  }

  let creatorName: string | null = null;
  if (orc.created_by) {
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", orc.created_by)
      .single();
    creatorName = creator?.full_name ?? null;
  }

  return {
    success: true,
    data: { ...orc, members: membersWithProfiles, creator_name: creatorName },
  };
}

// ---------------------------------------------------------------------------
// Create orcamento (admin only)
// ---------------------------------------------------------------------------
export async function createOrcamento(
  data: OrcamentoFormData
): Promise<ActionResult<Orcamento>> {
  const parsed = orcamentoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Apenas administradores podem criar orçamentos" };
  }

  const { data: orcamento, error } = await supabase
    .from("orcamentos")
    .insert({ name: parsed.data.name, created_by: user.id })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Erro ao criar orçamento: ${error.message}` };
  }

  // Add admin as owner
  await supabase.from("orcamento_members").insert({
    orcamento_id: orcamento.id,
    user_id: user.id,
    role: "owner",
  });

  revalidatePath("/admin/orcamentos");
  return { success: true, data: orcamento };
}

// ---------------------------------------------------------------------------
// Update orcamento (admin only)
// ---------------------------------------------------------------------------
export async function updateOrcamento(
  id: string,
  data: OrcamentoFormData
): Promise<ActionResult<Orcamento>> {
  const parsed = orcamentoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { data: orcamento, error } = await supabase
    .from("orcamentos")
    .update({ name: parsed.data.name })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { success: false, error: `Erro ao atualizar orçamento: ${error.message}` };
  }

  revalidatePath("/admin/orcamentos");
  return { success: true, data: orcamento };
}

// ---------------------------------------------------------------------------
// Delete orcamento (admin only)
// ---------------------------------------------------------------------------
export async function deleteOrcamento(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { error } = await supabase
    .from("orcamentos")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: `Erro ao excluir orçamento: ${error.message}` };
  }

  revalidatePath("/admin/orcamentos");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Add member (admin only)
// ---------------------------------------------------------------------------
export async function addOrcamentoMember(
  orcamentoId: string,
  userId: string,
  role: OrcamentoRole
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { error } = await supabase.from("orcamento_members").insert({
    orcamento_id: orcamentoId,
    user_id: userId,
    role,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Usuário já é membro deste orçamento" };
    }
    return { success: false, error: `Erro ao adicionar membro: ${error.message}` };
  }

  revalidatePath("/admin/orcamentos");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Add member by email (admin only)
// ---------------------------------------------------------------------------
export async function addOrcamentoMemberByEmail(
  orcamentoId: string,
  email: string,
  role: OrcamentoRole
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

  // Find user by email using database function (SECURITY DEFINER)
  const { data: users } = await supabase.rpc("find_user_by_email", {
    user_email: email.toLowerCase(),
  });

  if (!users || users.length === 0) {
    return { success: false, error: "Usuário não encontrado" };
  }

  const targetUserId = users[0].id;

  // Check if already a member
  const { data: existing } = await supabase
    .from("orcamento_members")
    .select("id")
    .eq("orcamento_id", orcamentoId)
    .eq("user_id", targetUserId)
    .single();

  if (existing) {
    return { success: false, error: "Já é membro deste orçamento" };
  }

  const { error } = await supabase.from("orcamento_members").insert({
    orcamento_id: orcamentoId,
    user_id: targetUserId,
    role,
  });

  if (error) {
    return { success: false, error: `Erro ao adicionar membro: ${error.message}` };
  }

  revalidatePath("/admin/orcamentos");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Remove member (admin only)
// ---------------------------------------------------------------------------
export async function removeOrcamentoMember(
  orcamentoId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { error } = await supabase
    .from("orcamento_members")
    .delete()
    .eq("orcamento_id", orcamentoId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: `Erro ao remover membro: ${error.message}` };
  }

  // Clear selected_orcamento_id if user had this one selected
  await supabase
    .from("profiles")
    .update({ selected_orcamento_id: null })
    .eq("id", userId)
    .eq("selected_orcamento_id", orcamentoId);

  revalidatePath("/admin/orcamentos");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Update member role (admin only)
// ---------------------------------------------------------------------------
export async function updateMemberRole(
  orcamentoId: string,
  userId: string,
  role: OrcamentoRole
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Acesso negado" };
  }

  const { error } = await supabase
    .from("orcamento_members")
    .update({ role })
    .eq("orcamento_id", orcamentoId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: `Erro ao atualizar função: ${error.message}` };
  }

  revalidatePath("/admin/orcamentos");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Switch orcamento (any user)
// ---------------------------------------------------------------------------
export async function switchOrcamento(orcamentoId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Não autenticado" };
  }

  // Verify membership
  const { data: membership } = await supabase
    .from("orcamento_members")
    .select("id")
    .eq("orcamento_id", orcamentoId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return { success: false, error: "Você não é membro deste orçamento" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ selected_orcamento_id: orcamentoId })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: `Erro ao trocar orçamento: ${error.message}` };
  }

  revalidatePath("/dashboard");
  revalidatePath("/expenses");
  revalidatePath("/income");
  revalidatePath("/pendencias");
  revalidatePath("/history");
  return { success: true };
}
