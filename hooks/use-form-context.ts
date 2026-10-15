"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { fetchCategories } from "@/lib/data/categories";
import { fetchLatestExchangeRate } from "@/lib/data/exchange-rates";
import { fetchProfile } from "@/lib/data/profile";
import { useAsyncData } from "@/hooks/use-async-data";
import type { Category, ExchangeRate, Profile } from "@/types";

export type FormContext = {
  profile: Profile;
  categories: Category[];
  rate: ExchangeRate | null;
};

/** Profil, daftar kategori, dan kurs terbaru untuk form transaksi & halaman terkait. */
export function useFormContext() {
  const { user } = useAuth();

  return useAsyncData<FormContext>(async () => {
    if (!user) {
      throw new Error("Sesi tidak ditemukan.");
    }

    const [profile, categories, rate] = await Promise.all([
      fetchProfile(user.id),
      fetchCategories(),
      fetchLatestExchangeRate(),
    ]);

    return { profile, categories, rate };
  });
}
