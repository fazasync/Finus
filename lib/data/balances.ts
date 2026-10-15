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
 * Menyimpan saldo awal. Mendukung insert dan update per mata uang (upsert).
 */
export async function saveInitialBalances(
  userId: string,
  entries: Array<{ currency: Currency; initialBalance: number }>,
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("balances").upsert(
    entries.map((entry) => ({
      user_id: userId,
      currency: entry.currency,
      initial_balance: entry.initialBalance,
    })),
    { onConflict: "user_id,currency" },
  );

  if (error) {
    throw toError(error);
  }
}

