export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return "Email wajib diisi.";
  }

  if (!isValidEmail(email)) {
    return "Format email tidak valid.";
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password wajib diisi.";
  }

  if (password.length < 6) {
    return "Password minimal 6 karakter.";
  }

  return null;
}

/**
 * Mengubah input nominal menjadi angka. Menerima "1.250.000", "350,50", "1.250.000,75", "35 000".
 * Bila hanya ada titik, tiga digit di belakang titik dianggap pemisah ribuan.
 */
export function parseAmount(input: string): number {
  let value = input.trim().replace(/\s/g, "");

  if (!value) {
    return Number.NaN;
  }

  const hasComma = value.includes(",");
  const hasDot = value.includes(".");

  if (hasComma && hasDot) {
    value = value.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    value = value.replace(/,/g, ".");
  } else if (hasDot) {
    const segments = value.split(".");
    const isThousands = segments.slice(1).every((segment) => segment.length === 3);
    if (isThousands) {
      value = segments.join("");
    }
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function validateAmount(input: string): string | null {
  if (!input.trim()) {
    return "Nominal wajib diisi.";
  }

  const amount = parseAmount(input);

  if (!Number.isFinite(amount)) {
    return "Nominal harus berupa angka.";
  }

  if (amount <= 0) {
    return "Nominal harus lebih besar dari nol.";
  }

  return null;
}

export function validateDescription(description: string): string | null {
  const trimmed = description.trim();

  if (!trimmed) {
    return "Keterangan wajib diisi.";
  }

  if (trimmed.length > 200) {
    return "Keterangan maksimal 200 karakter.";
  }

  return null;
}

export function validateRate(input: string): string | null {
  if (!input.trim()) {
    return "Kurs wajib diisi.";
  }

  const rate = parseAmount(input);

  if (!Number.isFinite(rate)) {
    return "Kurs harus berupa angka.";
  }

  if (rate <= 0) {
    return "Kurs harus lebih besar dari nol.";
  }

  return null;
}

export function validateInitialBalance(input: string): string | null {
  if (!input.trim()) {
    return "Saldo awal wajib diisi.";
  }

  const amount = parseAmount(input);

  if (!Number.isFinite(amount)) {
    return "Saldo awal harus berupa angka.";
  }

  if (amount < 0) {
    return "Saldo awal tidak boleh negatif.";
  }

  return null;
}
