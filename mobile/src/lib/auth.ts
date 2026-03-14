import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { Profile } from "../shared/types";

const SELECTED_ORCAMENTO_KEY = "selected_orcamento_id";

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  // Fetch profile to get selected_orcamento_id and check approval
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError) throw new Error("Erro ao carregar perfil");

  const typedProfile = profile as Profile;

  if (!typedProfile.approved) {
    await supabase.auth.signOut();
    throw new Error("Conta aguardando aprovação");
  }

  if (typedProfile.selected_orcamento_id) {
    await AsyncStorage.setItem(
      SELECTED_ORCAMENTO_KEY,
      typedProfile.selected_orcamento_id,
    );
  }

  return typedProfile;
}

export async function signOut() {
  await AsyncStorage.removeItem(SELECTED_ORCAMENTO_KEY);
  await supabase.auth.signOut();
}

export async function getSelectedOrcamentoId(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(SELECTED_ORCAMENTO_KEY);
  if (stored) return stored;

  // Fallback: fetch from profile (needed in widget headless context
  // where AsyncStorage may not have the value cached)
  const profile = await getProfile();
  if (profile?.selected_orcamento_id) {
    await AsyncStorage.setItem(
      SELECTED_ORCAMENTO_KEY,
      profile.selected_orcamento_id,
    );
    return profile.selected_orcamento_id;
  }

  return null;
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return (data as Profile) ?? null;
}
