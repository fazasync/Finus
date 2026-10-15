"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import { toError } from "./errors";
import type { Category } from "@/types";

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");

  if (error) {
    throw toError(error);
  }

  return (data ?? []) as Category[];
}
