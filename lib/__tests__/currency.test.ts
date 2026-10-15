import { describe, expect, it } from "vitest";

import {
  convertIdrToMyr,
  convertMyrToIdr,
  formatCurrency,
  formatExchangeRate,
  isValidRate,
} from "../currency";

describe("konversi kurs (IDR per 1 MYR)", () => {
  it("RM10 pada kurs Rp3.500 menghasilkan Rp35.000", () => {
    expect(convertMyrToIdr(10, 3500)).toBe(35000);
  });

  it("IDR 35.000 pada kurs Rp3.500 menghasilkan RM10", () => {
    expect(convertIdrToMyr(35000, 3500)).toBe(10);
  });

  it("menolak kurs nol", () => {
    expect(() => convertMyrToIdr(10, 0)).toThrow();
    expect(() => convertIdrToMyr(35000, 0)).toThrow();
  });

  it("menolak kurs negatif", () => {
    expect(() => convertMyrToIdr(10, -3500)).toThrow();
    expect(() => convertIdrToMyr(35000, -1)).toThrow();
  });

  it("isValidRate hanya menerima angka positif", () => {
    expect(isValidRate(3500)).toBe(true);
    expect(isValidRate(0.5)).toBe(true);
    expect(isValidRate(0)).toBe(false);
    expect(isValidRate(-1)).toBe(false);
    expect(isValidRate(Number.NaN)).toBe(false);
  });
});

describe("snapshot kurs transaksi", () => {
  it("nilai hasil konversi tidak berubah ketika kurs pengaturan diperbarui", () => {
    const amountMyr = 10;
    const snapshotRate = 3500;
    const convertedIdr = convertMyrToIdr(amountMyr, snapshotRate);

    // Pengguna memperbarui kurs pengaturan.
    let currentRate = snapshotRate;
    currentRate = 4200;

    // Snapshot transaksi tetap memakai kurs saat transaksi dibuat.
    expect(convertMyrToIdr(amountMyr, snapshotRate)).toBe(convertedIdr);
    expect(currentRate).toBe(4200);
    expect(convertedIdr).toBe(35000);
  });
});

describe("format", () => {
  it("memformat IDR tanpa desimal dengan titik ribuan", () => {
    expect(formatCurrency(1250000, "IDR")).toBe("Rp1.250.000");
  });

  it("memformat MYR dengan dua desimal", () => {
    expect(formatCurrency(350, "MYR")).toBe("RM350.00");
    expect(formatCurrency(1250, "MYR")).toBe("RM1,250.00");
  });

  it("menampilkan kurs dengan definisi eksplisit", () => {
    expect(formatExchangeRate(3500)).toBe("1 MYR = Rp3.500");
  });
});
