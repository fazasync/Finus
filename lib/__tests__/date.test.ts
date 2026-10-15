import { describe, expect, it } from "vitest";

import {
  dateKeyInTimeZone,
  formatDateInTimeZone,
  fromDateTimeLocalValue,
  startOfDayInTimeZone,
  startOfNextDayInTimeZone,
  toDateTimeLocalValue,
  weeklyPeriod,
  zonedTimeToUtc,
} from "../date";

describe("batas hari dan zona waktu", () => {
  it("menggeser batas hari sesuai zona waktu profil", () => {
    // 2026-10-15T18:30:00Z = 2026-10-16 01:30 di Asia/Jakarta (UTC+7).
    const instant = new Date("2026-10-15T18:30:00.000Z");

    expect(dateKeyInTimeZone(instant, "Asia/Jakarta")).toBe("2026-10-16");
    expect(dateKeyInTimeZone(instant, "UTC")).toBe("2026-10-15");
  });

  it("startOfDayInTimeZone menghasilkan tengah malam lokal dalam UTC", () => {
    const instant = new Date("2026-10-15T18:30:00.000Z");
    const start = startOfDayInTimeZone(instant, "Asia/Jakarta");

    expect(start.toISOString()).toBe("2026-10-15T17:00:00.000Z");
  });

  it("zona dengan offset berbeda memberi awal hari berbeda", () => {
    const instant = new Date("2026-10-15T18:30:00.000Z");
    const makassar = startOfDayInTimeZone(instant, "Asia/Makassar");

    // WITA = UTC+8 → tengah malam lokal 2026-10-16 = 16:00Z hari sebelumnya.
    expect(makassar.toISOString()).toBe("2026-10-15T16:00:00.000Z");
  });

  it("transaksi 23:59 lokal masuk hari ini, 00:00 berikutnya masuk hari berikutnya", () => {
    const beforeMidnight = zonedTimeToUtc(2026, 10, 15, 23, 59, "Asia/Jakarta");
    const afterMidnight = zonedTimeToUtc(2026, 10, 16, 0, 0, "Asia/Jakarta");

    expect(dateKeyInTimeZone(beforeMidnight, "Asia/Jakarta")).toBe("2026-10-15");
    expect(dateKeyInTimeZone(afterMidnight, "Asia/Jakarta")).toBe("2026-10-16");
  });

  it("startOfNextDayInTimeZone tepat di tengah malam berikutnya", () => {
    const instant = zonedTimeToUtc(2026, 10, 15, 13, 0, "Asia/Jakarta");
    const next = startOfNextDayInTimeZone(instant, "Asia/Jakarta");

    expect(next.toISOString()).toBe("2026-10-15T17:00:00.000Z");
  });
});

describe("periode laporan mingguan", () => {
  it("berisi tujuh hari kalender termasuk hari ini", () => {
    const now = zonedTimeToUtc(2026, 10, 15, 10, 0, "Asia/Jakarta");
    const period = weeklyPeriod("Asia/Jakarta", now);

    expect(period.days).toHaveLength(7);
    expect(period.days[0]).toBe("2026-10-09");
    expect(period.days[6]).toBe("2026-10-15");
  });

  it("rentang mencakup awal hari pertama hingga awal hari setelah hari terakhir", () => {
    const now = zonedTimeToUtc(2026, 10, 15, 10, 0, "Asia/Jakarta");
    const period = weeklyPeriod("Asia/Jakarta", now);

    expect(period.start.toISOString()).toBe("2026-10-08T17:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-10-15T17:00:00.000Z");
  });

  it("transaksi 30 menit sebelum tengah malam hari terakhir masih masuk periode", () => {
    const now = zonedTimeToUtc(2026, 10, 15, 10, 0, "Asia/Jakarta");
    const period = weeklyPeriod("Asia/Jakarta", now);
    const edge = zonedTimeToUtc(2026, 10, 15, 23, 30, "Asia/Jakarta");

    expect(edge.getTime()).toBeGreaterThanOrEqual(period.start.getTime());
    expect(edge.getTime()).toBeLessThan(period.end.getTime());
  });

  it("transaksi 30 menit setelah tengah malam hari terakhir berada di luar periode", () => {
    const now = zonedTimeToUtc(2026, 10, 15, 10, 0, "Asia/Jakarta");
    const period = weeklyPeriod("Asia/Jakarta", now);
    const outside = zonedTimeToUtc(2026, 10, 16, 0, 30, "Asia/Jakarta");

    expect(outside.getTime()).toBeGreaterThanOrEqual(period.end.getTime());
  });
});

describe("nilai datetime-local", () => {
  it("mengubah instan UTC ke waktu lokal profil", () => {
    const instant = new Date("2026-10-15T07:30:00.000Z");
    expect(toDateTimeLocalValue(instant, "Asia/Jakarta")).toBe("2026-10-15T14:30");
  });

  it("bolak-balik tetap sama", () => {
    const value = "2026-10-15T14:30";
    const instant = fromDateTimeLocalValue(value, "Asia/Jakarta");

    expect(instant).not.toBeNull();
    expect(toDateTimeLocalValue(instant as Date, "Asia/Jakarta")).toBe(value);
  });

  it("menolak nilai tidak valid", () => {
    expect(fromDateTimeLocalValue("bukan-tanggal", "Asia/Jakarta")).toBeNull();
  });
});

describe("format tanggal", () => {
  it("menampilkan tanggal bahasa Indonesia pada zona profil", () => {
    const instant = new Date("2026-10-15T18:30:00.000Z");
    expect(formatDateInTimeZone(instant, "Asia/Jakarta")).toContain("16 Oktober 2026");
  });
});
