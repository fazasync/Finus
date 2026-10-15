"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { toError } from "./errors";
import type { Profile } from "@/types";

export async function fetchProfile(userId: string): Promise<Profile> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  if (data) {
    return data as Profile;
  }

  // Profil biasanya dibuat oleh trigger saat registrasi; buat bila belum ada.
  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("*")
    .single();

  if (insertError) {
    throw toError(insertError);
  }

  return created as Profile;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "base_currency" | "timezone">>,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);

  if (error) {
    throw toError(error);
  }
}
