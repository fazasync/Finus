import { dateKeyInTimeZone, type WeeklyPeriod } from "@/lib/date";
import { convertIdrToMyr, convertMyrToIdr, type Currency } from "@/lib/currency";
import type { Transaction, TransactionType } from "@/types";

type ReportTransaction = Pick<
  Transaction,
  "id" | "type" | "amount" | "currency" | "transaction_at" | "category_id"
> & {
  category?: { id: string; name: string; type: TransactionType } | null;
};

export type DailyExpense = {
  day: string;
  totals: Record<Currency, number>;
};

export type CategoryExpense = {
  categoryId: string;
  categoryName: string;
  currency: Currency;
  total: number;
};

export type CombinedTotal = {
  currency: Currency;
  rate: number;
  value: number;
};

export type WeeklyReport = {
  days: string[];
  daily: DailyExpense[];
  totals: Record<Currency, number>;
  categories: CategoryExpense[];
  combined: CombinedTotal | null;
};

export function isWithinPeriod(transactionAt: string, period: WeeklyPeriod): boolean {
  const time = new Date(transactionAt).getTime();
  return time >= period.start.getTime() && time < period.end.getTime();
}

/** Hanya transaksi pengeluaran di dalam periode yang dipakai untuk laporan. */
export function selectExpenseTransactions(
  transactions: ReportTransaction[],
  period: WeeklyPeriod,
): ReportTransaction[] {
  return transactions.filter(
    (transaction) => transaction.type === "expense" && isWithinPeriod(transaction.transaction_at, period),
  );
}

export function emptyTotals(): Record<Currency, number> {
  return { IDR: 0, MYR: 0 };
}

export function buildDailyExpenses(
  transactions: ReportTransaction[],
  period: WeeklyPeriod,
  timeZone: string,
): DailyExpense[] {
  return period.days.map((day) => {
    const totals = emptyTotals();

    for (const transaction of transactions) {
      if (dateKeyInTimeZone(new Date(transaction.transaction_at), timeZone) === day) {
        totals[transaction.currency] += transaction.amount;
      }
    }

    return { day, totals };
  });
}

export function buildCategoryExpenses(transactions: ReportTransaction[]): CategoryExpense[] {
  const grouped = new Map<string, CategoryExpense>();

  for (const transaction of transactions) {
    const categoryId = transaction.category_id;
    const key = `${categoryId}:${transaction.currency}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.total += transaction.amount;
      continue;
    }

    grouped.set(key, {
      categoryId,
      categoryName: transaction.category?.name ?? "Tanpa kategori",
      currency: transaction.currency,
      total: transaction.amount,
    });
  }

  return [...grouped.values()].sort((a, b) => {
    if (a.currency !== b.currency) return a.currency === "IDR" ? -1 : 1;
    return b.total - a.total;
  });
}

export function combineTotals(
  totals: Record<Currency, number>,
  baseCurrency: Currency,
  rate: number | null,
): CombinedTotal | null {
  if (!rate || rate <= 0) {
    return null;
  }

  if (baseCurrency === "IDR") {
    return {
      currency: "IDR",
      rate,
      value: totals.IDR + convertMyrToIdr(totals.MYR, rate),
    };
  }

  return {
    currency: "MYR",
    rate,
    value: totals.MYR + convertIdrToMyr(totals.IDR, rate),
  };
}

export function buildWeeklyReport({
  transactions,
  period,
  timeZone,
  baseCurrency,
  rate,
}: {
  transactions: ReportTransaction[];
  period: WeeklyPeriod;
  timeZone: string;
  baseCurrency: Currency;
  rate: number | null;
}): WeeklyReport {
  const expenses = selectExpenseTransactions(transactions, period);
  const totals = emptyTotals();

  for (const transaction of expenses) {
    totals[transaction.currency] += transaction.amount;
  }

  return {
    days: period.days,
    daily: buildDailyExpenses(expenses, period, timeZone),
    totals,
    categories: buildCategoryExpenses(expenses),
    combined: combineTotals(totals, baseCurrency, rate),
  };
}
