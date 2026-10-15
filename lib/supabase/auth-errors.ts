const AUTH_ERROR_MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "Email atau password salah."],
  [/email not confirmed/i, "Email belum dikonfirmasi. Periksa kotak masuk untuk tautan verifikasi."],
  [/user already registered/i, "Email ini sudah terdaftar. Coba masuk."],
  [/password should be at least/i, "Password minimal 6 karakter."],
  [/unable to validate email address/i, "Format email tidak valid."],
  [/email address .* is invalid/i, "Format email tidak valid."],
  [/for security purposes/i, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."],
  [/rate limit/i, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."],
  [/failed to fetch|network/i, "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi."],
  [/signup(s)? (are )?disabled/i, "Registrasi sedang dinonaktifkan."],
];

export function mapAuthError(message?: string | null): string {
  if (!message) {
    return "Terjadi kesalahan. Coba lagi.";
  }

  for (const [pattern, friendly] of AUTH_ERROR_MAP) {
    if (pattern.test(message)) {
      return friendly;
    }
  }

  return "Autentikasi gagal. Coba lagi.";
}
