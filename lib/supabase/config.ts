const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && isValidHttpUrl(SUPABASE_URL));
}

export function getSupabaseConfig(): SupabaseConfig {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local (lihat .env.example dan supabase/setup.md).",
    );
  }

  if (!isValidHttpUrl(SUPABASE_URL)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL tidak valid. Gunakan URL lengkap, mis. https://<project-ref>.supabase.co (bukan hanya project ref).",
    );
  }

  return { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
}
