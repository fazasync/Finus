type DbErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
} | null;

const NETWORK_MESSAGE =
  "Tidak dapat menghubungi server. Periksa koneksi internet lalu coba lagi.";

export function describeDbError(error: DbErrorLike): string {
  if (!error) {
    return "Terjadi kesalahan.";
  }

  const message = error.message ?? "";
  const code = error.code ?? "";

  if (/fetch|network|load failed|failed to fetch/i.test(message)) {
    return NETWORK_MESSAGE;
  }

  if (code === "42P01" || /relation .* does not exist/i.test(message)) {
    return "Skema database belum disiapkan. Jalankan migration pada supabase/migrations/ (lihat supabase/setup.md).";
  }

  if (code === "23514") {
    return "Nilai tidak memenuhi aturan database. Periksa kembali nominal dan kurs.";
  }

  if (code === "23503") {
    return "Data terkait tidak ditemukan atau tidak boleh dihapus.";
  }

  if (code === "23505") {
    return "Data ini sudah ada.";
  }

  if (code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "Akses ditolak. Anda hanya dapat mengubah data milik sendiri.";
  }

  if (code === "PGRST116") {
    return "Data tidak ditemukan.";
  }

  return message || "Terjadi kesalahan saat mengakses database.";
}

export function toError(error: DbErrorLike): Error {
  return new Error(describeDbError(error));
}
