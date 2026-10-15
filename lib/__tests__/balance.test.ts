import { describe, expect, it } from "vitest";

import { summarizeAll, summarizeCurrency, type TransactionLike } from "../balance";

function tx(type: "income" | "expense", amount: number, currency: "IDR" | "MYR"): TransactionLike {
  return { type, amount, currency };
}

describe("saldo per mata uang", () => {
  it("saldo awal 100 + pemasukan 20 - pengeluaran 30 = 90", () => {
    const transactions = [tx("income", 20, "IDR"), tx("expense", 30, "IDR")];
    const summary = summarizeCurrency("IDR", 100, transactions);

    expect(summary.balance).toBe(90);
    expect(summary.income).toBe(20);
    expect(summary.expense).toBe(30);
  });

  it("mengedit nominal mengubah saldo", () => {
    const initial = 100;
    const before = summarizeCurrency("IDR", initial, [tx("expense", 30, "IDR")]);
    const after = summarizeCurrency("IDR", initial, [tx("expense", 50, "IDR")]);

    expect(before.balance).toBe(70);
    expect(after.balance).toBe(50);
  });

  it("menghapus transaksi mengubah saldo", () => {
    const initial = 100;
    const transactions = [tx("income", 20, "IDR"), tx("expense", 30, "IDR")];
    const before = summarizeCurrency("IDR", initial, transactions);
    const after = summarizeCurrency("IDR", initial, [tx("income", 20, "IDR")]);

    expect(before.balance).toBe(90);
    expect(after.balance).toBe(120);
  });

  it("tidak mencampur mata uang", () => {
    const transactions = [tx("income", 100, "IDR"), tx("income", 10, "MYR")];
    const summaries = summarizeAll({ IDR: 0, MYR: 0 }, transactions);

    expect(summaries.find((item) => item.currency === "IDR")?.balance).toBe(100);
    expect(summaries.find((item) => item.currency === "MYR")?.balance).toBe(10);
  });

  it("pemasukan MYR tidak mengubah saldo IDR", () => {
    const summary = summarizeCurrency("IDR", 50, [tx("income", 10, "MYR")]);
    expect(summary.balance).toBe(50);
  });
});
