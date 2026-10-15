export const DEFAULT_TIMEZONE = "Asia/Jakarta";

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "WIB — Asia/Jakarta (UTC+7)" },
  { value: "Asia/Makassar", label: "WITA — Asia/Makassar (UTC+8)" },
  { value: "Asia/Jayapura", label: "WIT — Asia/Jayapura (UTC+9)" },
  { value: "Asia/Kuala_Lumpur", label: "Malaysia — Asia/Kuala_Lumpur (UTC+8)" },
  { value: "UTC", label: "UTC" },
];

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = partsFormatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  partsFormatterCache.set(timeZone, formatter);
  return formatter;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: lookup("hour") % 24,
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

/** Offset zona waktu (ms) pada saat `date`. Positif berarti di timur UTC. */
export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Mengubah waktu kalender lokal pada `timeZone` menjadi instan UTC.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  timeZone: string = DEFAULT_TIMEZONE,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = getTimeZoneOffsetMs(new Date(guess), timeZone);
  let utc = guess - offset;

  // Koreksi sekali lagi untuk kasus pergeseran DST di sekitar ambang.
  const offsetAgain = getTimeZoneOffsetMs(new Date(utc), timeZone);
  if (offsetAgain !== offset) {
    utc = guess - offsetAgain;
  }

  return new Date(utc);
}

/** Kunci tanggal lokal `YYYY-MM-DD` untuk `date` pada `timeZone`. */
export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

/** Awal hari (00:00 lokal) pada `timeZone`, dalam instan UTC. */
export function startOfDayInTimeZone(date: Date, timeZone: string): Date {
  const parts = getZonedParts(date, timeZone);
  return zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, timeZone);
}

/** Awal hari berikutnya setelah `date` (00:00 lokal) pada `timeZone`. */
export function startOfNextDayInTimeZone(date: Date, timeZone: string): Date {
  const start = startOfDayInTimeZone(date, timeZone);
  return addCalendarDaysInTimeZone(start, 1, timeZone);
}

/** Menambah `days` hari kalender lokal, tetap aman terhadap DST. */
export function addCalendarDaysInTimeZone(date: Date, days: number, timeZone: string): Date {
  const parts = getZonedParts(date, timeZone);
  const local = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const shifted = new Date(local + days * 24 * 60 * 60 * 1000);

  return zonedTimeToUtc(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    0,
    0,
    timeZone,
  );
}

export type WeeklyPeriod = {
  /** Awal periode (00:00 lokal hari pertama, instan UTC). */
  start: Date;
  /** Batas akhir eksklusif (00:00 lokal hari setelah hari terakhir). */
  end: Date;
  /** Kunci tanggal lokal `YYYY-MM-DD`, urut dari terlama ke terbaru. */
  days: string[];
};

/**
 * Periode laporan: hari ini dan enam hari kalender sebelumnya pada `timeZone`.
 * Mengembalikan rentang, bukan durasi 168 jam.
 */
export function weeklyPeriod(
  timeZone: string = DEFAULT_TIMEZONE,
  now: Date = new Date(),
): WeeklyPeriod {
  const todayKey = dateKeyInTimeZone(now, timeZone);
  const [year, month, day] = todayKey.split("-").map(Number);

  const startToday = zonedTimeToUtc(year, month, day, 0, 0, timeZone);
  const start = addCalendarDaysInTimeZone(startToday, -6, timeZone);
  const end = addCalendarDaysInTimeZone(startToday, 1, timeZone);

  const days: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    const cursor = addCalendarDaysInTimeZone(start, index, timeZone);
    days.push(dateKeyInTimeZone(cursor, timeZone));
  }

  return { start, end, days };
}

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dateFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dateFormatterCache.get(timeZone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone,
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  dateFormatterCache.set(timeZone, formatter);
  return formatter;
}

/** Tanggal dalam bahasa Indonesia sesuai `timeZone`, mis. "3 Oktober 2026". */
export function formatDateInTimeZone(date: Date | string, timeZone: string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return dateFormatter(timeZone).format(value);
}

/** Tanggal + jam sesuai `timeZone`, mis. "3 Okt 2026, 14.30". */
export function formatDateTimeInTimeZone(date: Date | string, timeZone: string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

/** Label pendek hari untuk grafik, mis. "Sen". */
export function formatDayLabel(dayKey: string, timeZone: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const noon = zonedTimeToUtc(year, month, day, 12, 0, timeZone);
  return new Intl.DateTimeFormat("id-ID", { timeZone, weekday: "short" }).format(noon);
}

/** Nilai `datetime-local` (YYYY-MM-DDTHH:mm) untuk instan `date` pada `timeZone`. */
export function toDateTimeLocalValue(date: Date, timeZone: string): string {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}T${parts.hour
    .toString()
    .padStart(2, "0")}:${parts.minute.toString().padStart(2, "0")}`;
}

/** Mengubah nilai `datetime-local` (waktu lokal `timeZone`) menjadi instan UTC. */
export function fromDateTimeLocalValue(value: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  return zonedTimeToUtc(year, month, day, hour, minute, timeZone);
}
