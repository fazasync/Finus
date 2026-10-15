import { describe, expect, it } from "vitest";

import {
  parseAmount,
  validateAmount,
  validateDescription,
  validateEmail,
  validateInitialBalance,
  validatePassword,
  validateRate,
} from "../validation";

describe("validasi nominal", () => {
  it("menerima nomimal positif", () => {
    expect(validateAmount("35000")).toBeNull();
  });

  it("menolak nominal nol atau negatif", () => {
    expect(validateAmount("0")).not.toBeNull();
    expect(validateAmount("-5")).not.toBeNull();
  });

  it("menolak nominal kosong atau bukan angka", () => {
    expect(validateAmount("")).not.toBeNull();
    expect(validateAmount("abc")).not.toBeNull();
  });

  it("membaca format ribuan dan desimal", () => {
    expect(parseAmount("1.250.000")).toBe(1250000);
    expect(parseAmount("350,50")).toBe(350.5);
    expect(parseAmount("1.250.000,75")).toBe(1250000.75);
  });
});

describe("validasi keterangan", () => {
  it("wajib diisi", () => {
    expect(validateDescription("   ")).not.toBeNull();
  });

  it("menerima keterangan wajar", () => {
    expect(validateDescription("Makan siang")).toBeNull();
  });

  it("menolak keterangan terlalu panjang", () => {
    expect(validateDescription("a".repeat(201))).not.toBeNull();
  });
});

describe("validasi kurs", () => {
  it("menolak kurs nol dan negatif", () => {
    expect(validateRate("0")).not.toBeNull();
    expect(validateRate("-3500")).not.toBeNull();
  });

  it("menerima kurs positif", () => {
    expect(validateRate("3500")).toBeNull();
    expect(validateRate("3.500")).toBeNull();
  });
});

describe("validasi saldo awal", () => {
  it("menerima nol dan positif", () => {
    expect(validateInitialBalance("0")).toBeNull();
    expect(validateInitialBalance("150000")).toBeNull();
  });

  it("menolak negatif dan kosong", () => {
    expect(validateInitialBalance("-1")).not.toBeNull();
    expect(validateInitialBalance("")).not.toBeNull();
  });
});

describe("validasi autentikasi", () => {
  it("memvalidasi email", () => {
    expect(validateEmail("budi@example.com")).toBeNull();
    expect(validateEmail("bukan-email")).not.toBeNull();
    expect(validateEmail("")).not.toBeNull();
  });

  it("memvalidasi password minimal 6 karakter", () => {
    expect(validatePassword("123456")).toBeNull();
    expect(validatePassword("12345")).not.toBeNull();
    expect(validatePassword("")).not.toBeNull();
  });
});
