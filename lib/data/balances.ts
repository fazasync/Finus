"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { toError } from "./errors";
import type { Balance, Currency } from "@/types";

export async function fetchBalances(): Promise<Balance[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("balances").select("*");

  if (error) {
    throw toError(error);
  }

  return (data ?? []) as Balance[];
}

/**
 * Menyimpan saldo awal. Hanya boleh dipanggil untuk mata uang yang belum punya baris;
 * baris yang sudah ada tidak diubah (aturan saldo awal diisi sekali).
 */
export async function setInitialBalances(
  userId: string,
  existing: Currency[],
  entries: Array<{ currency: Currency; initialBalance: number }>,
): Promise<void> {
  const toInsert = entries.filter((entry) => !existing.includes(entry.currency));

  if (toInsert.length === 0) {
    return;
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("balances").insert(
    toInsert.map((entry) => ({
      user_id: userId,
      currency: entry.currency,
      initial_balance: entry.initialBalance,
    })),
  );

  if (error) {
    throw toError(error);
  }
}
