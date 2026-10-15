"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { toError } from "./errors";
import type { ExchangeRate } from "@/types";

export async function fetchLatestExchangeRate(): Promise<ExchangeRate | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .order("effective_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  return (data as ExchangeRate | null) ?? null;
}

export async function fetchExchangeRateHistory(limit = 10): Promise<ExchangeRate[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .order("effective_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw toError(error);
  }

  return (data ?? []) as ExchangeRate[];
}

/** Kurs baru selalu ditambahkan sebagai riwayat baru, bukan menimpa yang lama. */
export async function addExchangeRate(userId: string, rate: number): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("exchange_rates").insert({
    user_id: userId,
    rate,
    effective_at: new Date().toISOString(),
  });

  if (error) {
    throw toError(error);
  }
}
