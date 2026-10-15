"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { toError } from "./errors";
import type { Currency, TransactionType, TransactionWithCategory } from "@/types";

export type TransactionFilters = {
  search?: string;
  fromIso?: string;
  toIso?: string;
  categoryId?: string;
  type?: TransactionType | "";
  currency?: Currency | "";
  order?: "newest" | "oldest";
  page?: number;
  pageSize?: number;
};

export type TransactionPage = {
  items: TransactionWithCategory[];
  count: number;
};

export type TransactionInput = {
  categoryId: string;
  type: TransactionType;
  description: string;
  amount: number;
  currency: Currency;
  exchangeRate: number | null;
  transactionAtIso: string;
};

const TRANSACTION_SELECT = "*, category:categories(id, name, type)";

export async function fetchTransactionPage(
  filters: TransactionFilters,
): Promise<TransactionPage> {
  const supabase = getSupabaseBrowserClient();
  const page = filters.page ?? 0;
  const pageSize = filters.pageSize ?? 20;

  let query = supabase
    .from("transactions")
    .select(TRANSACTION_SELECT, { count: "exact" });

  if (filters.search?.trim()) {
    query = query.ilike("description", `%${filters.search.trim()}%`);
  }

  if (filters.fromIso) {
    query = query.gte("transaction_at", filters.fromIso);
  }

  if (filters.toIso) {
    query = query.lt("transaction_at", filters.toIso);
  }

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.currency) {
    query = query.eq("currency", filters.currency);
  }

  query = query
    .order("transaction_at", { ascending: filters.order === "oldest" })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    throw toError(error);
  }

  return { items: (data ?? []) as TransactionWithCategory[], count: count ?? 0 };
}

export async function fetchTransactionsSince(iso: string): Promise<TransactionWithCategory[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .gte("transaction_at", iso)
    .order("transaction_at", { ascending: false });

  if (error) {
    throw toError(error);
  }

  return (data ?? []) as TransactionWithCategory[];
}

export async function fetchAllTransactions(): Promise<TransactionWithCategory[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .order("transaction_at", { ascending: false });

  if (error) {
    throw toError(error);
  }

  return (data ?? []) as TransactionWithCategory[];
}

export async function fetchTransactionById(id: string): Promise<TransactionWithCategory | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw toError(error);
  }

  return (data as TransactionWithCategory | null) ?? null;
}

export async function createTransaction(userId: string, input: TransactionInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    category_id: input.categoryId,
    type: input.type,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    exchange_rate: input.exchangeRate,
    transaction_at: input.transactionAtIso,
  });

  if (error) {
    throw toError(error);
  }
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: input.categoryId,
      type: input.type,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      exchange_rate: input.exchangeRate,
      transaction_at: input.transactionAtIso,
    })
    .eq("id", id);

  if (error) {
    throw toError(error);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    throw toError(error);
  }
}
