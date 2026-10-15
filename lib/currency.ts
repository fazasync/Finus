export type Currency = "IDR" | "MYR";

export const CURRENCIES: Currency[] = ["IDR", "MYR"];

export function isCurrency(value: unknown): value is Currency {
  return value === "IDR" || value === "MYR";
}

export function currencyLabel(currency: Currency): string {
  return currency === "IDR" ? "Rupiah (IDR)" : "Ringgit Malaysia (MYR)";
}

export function formatCurrency(value: number, currency: Currency): string {
  if (!Number.isFinite(value)) {
    return currency === "IDR" ? "Rp0" : "RM0,00";
  }

  if (currency === "IDR") {
    return `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`;
  }

  return `RM${new Intl.NumberFormat("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatApprox(value: number, currency: Currency): string {
  return `≈ ${formatCurrency(value, currency)}`;
}

/**
 * Kurs selalu didefinisikan sebagai jumlah IDR untuk 1 MYR.
 */
export function formatExchangeRate(rate: number): string {
  return `1 MYR = ${formatCurrency(rate, "IDR")}`;
}

export function isValidRate(rate: number): boolean {
  return Number.isFinite(rate) && rate > 0;
}

export function convertMyrToIdr(amountMyr: number, rate: number): number {
  if (!isValidRate(rate) || !Number.isFinite(amountMyr)) {
    throw new Error("Kurs harus lebih besar dari nol.");
  }

  return amountMyr * rate;
}

export function convertIdrToMyr(amountIdr: number, rate: number): number {
  if (!isValidRate(rate) || !Number.isFinite(amountIdr)) {
    throw new Error("Kurs harus lebih besar dari nol.");
  }

  return amountIdr / rate;
}
