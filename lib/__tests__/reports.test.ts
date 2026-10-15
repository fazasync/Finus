import { describe, expect, it } from "vitest";

import { zonedTimeToUtc, weeklyPeriod } from "../date";
import { buildWeeklyReport, selectExpenseTransactions } from "../reports";
import type { Transaction } from "@/types";

type TransactionFixture = Transaction & {
  category: { id: string; name: string; type: "income" | "expense" } | null;
};

function transaction(
  overrides: Partial<TransactionFixture> &
    Pick<TransactionFixture, "type" | "amount" | "currency" | "transaction_at">,
): TransactionFixture {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    user_id: "user-1",
    category_id: overrides.category_id ?? "cat-1",
    description: overrides.description ?? "contoh",
    exchange_rate: null,
    created_at: overrides.transaction_at,
    updated_at: overrides.transaction_at,
    category: overrides.category ?? { id: "cat-1", name: "Makanan & Minuman", type: "expense" },
    ...overrides,
  };
}

const PERIOD_NOW = zonedTimeToUtc(2026, 10, 15, 10, 0, "Asia/Jakarta");
const PERIOD = weeklyPeriod("Asia/Jakarta", PERIOD_NOW);

describe("laporan mingguan", () => {
  it("tidak memasukkan transaksi di luar periode", () => {
    const transactions = [
      transaction({
        type: "expense",
        amount: 50000,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 15, 9, 0, "Asia/Jakarta").toISOString(),
      }),
      transaction({
        type: "expense",
        amount: 999999,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 8, 9, 0, "Asia/Jakarta").toISOString(),
      }),
    ];

    const selected = selectExpenseTransactions(transactions, PERIOD);
    expect(selected).toHaveLength(1);
    expect(selected[0].amount).toBe(50000);
  });

  it("pemasukan tidak dihitung sebagai pengeluaran", () => {
    const transactions = [
      transaction({
        type: "income",
        amount: 1000000,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 15, 9, 0, "Asia/Jakarta").toISOString(),
        category: { id: "cat-2", name: "Gaji", type: "income" },
      }),
      transaction({
        type: "expense",
        amount: 30000,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 15, 9, 0, "Asia/Jakarta").toISOString(),
      }),
    ];

    const report = buildWeeklyReport({
      transactions,
      period: PERIOD,
      timeZone: "Asia/Jakarta",
      baseCurrency: "IDR",
      rate: null,
    });

    expect(report.totals.IDR).toBe(30000);
    expect(report.totals.MYR).toBe(0);
  });

  it("menghitung tiap mata uang secara terpisah", () => {
    const transactions = [
      transaction({
        type: "expense",
        amount: 20000,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 15, 9, 0, "Asia/Jakarta").toISOString(),
      }),
      transaction({
        type: "expense",
        amount: 15,
        currency: "MYR",
        transaction_at: zonedTimeToUtc(2026, 10, 14, 9, 0, "Asia/Jakarta").toISOString(),
      }),
    ];

    const report = buildWeeklyReport({
      transactions,
      period: PERIOD,
      timeZone: "Asia/Jakarta",
      baseCurrency: "IDR",
      rate: null,
    });

    expect(report.totals.IDR).toBe(20000);
    expect(report.totals.MYR).toBe(15);
  });

  it("mengelompokkan pengeluaran pada hari lokal yang tepat", () => {
    const transactions = [
      // 23:30 lokal 15 Okt → masuk 2026-10-15
      transaction({
        type: "expense",
        amount: 10000,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 15, 23, 30, "Asia/Jakarta").toISOString(),
      }),
      // 00:30 lokal 16 Okt → di luar periode, tidak dihitung
      transaction({
        type: "expense",
        amount: 7000,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 16, 0, 30, "Asia/Jakarta").toISOString(),
      }),
    ];

    const report = buildWeeklyReport({
      transactions,
      period: PERIOD,
      timeZone: "Asia/Jakarta",
      baseCurrency: "IDR",
      rate: null,
    });

    const lastDay = report.daily.find((entry) => entry.day === "2026-10-15");
    expect(lastDay?.totals.IDR).toBe(10000);
  });

  it("total kategori sesuai transaksi pada periode", () => {
    const transactions = [
      transaction({
        type: "expense",
        amount: 10000,
        currency: "IDR",
        category_id: "cat-a",
        category: { id: "cat-a", name: "Transportasi", type: "expense" },
        transaction_at: zonedTimeToUtc(2026, 10, 15, 9, 0, "Asia/Jakarta").toISOString(),
      }),
      transaction({
        type: "expense",
        amount: 5000,
        currency: "IDR",
        category_id: "cat-a",
        category: { id: "cat-a", name: "Transportasi", type: "expense" },
        transaction_at: zonedTimeToUtc(2026, 10, 14, 9, 0, "Asia/Jakarta").toISOString(),
      }),
    ];

    const report = buildWeeklyReport({
      transactions,
      period: PERIOD,
      timeZone: "Asia/Jakarta",
      baseCurrency: "IDR",
      rate: null,
    });

    const transportasi = report.categories.find((item) => item.categoryId === "cat-a");
    expect(transportasi?.total).toBe(15000);
  });

  it("total gabungan hanya dihitung bila kurs tersedia dan diberi label", () => {
    const transactions = [
      transaction({
        type: "expense",
        amount: 35000,
        currency: "IDR",
        transaction_at: zonedTimeToUtc(2026, 10, 15, 9, 0, "Asia/Jakarta").toISOString(),
      }),
      transaction({
        type: "expense",
        amount: 10,
        currency: "MYR",
        transaction_at: zonedTimeToUtc(2026, 10, 14, 9, 0, "Asia/Jakarta").toISOString(),
      }),
    ];

    const withoutRate = buildWeeklyReport({
      transactions,
      period: PERIOD,
      timeZone: "Asia/Jakarta",
      baseCurrency: "IDR",
      rate: null,
    });
    expect(withoutRate.combined).toBeNull();

    const withRate = buildWeeklyReport({
      transactions,
      period: PERIOD,
      timeZone: "Asia/Jakarta",
      baseCurrency: "IDR",
      rate: 3500,
    });

    // 35.000 IDR + (10 MYR × 3.500) = 70.000 IDR
    expect(withRate.combined?.currency).toBe("IDR");
    expect(withRate.combined?.rate).toBe(3500);
    expect(withRate.combined?.value).toBe(70000);
  });
});
