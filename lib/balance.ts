import type { Currency, Transaction, TransactionType } from "@/types";

export type TransactionLike = Pick<Transaction, "type" | "amount" | "currency">;

export type BalanceSummary = {
  currency: Currency;
  initialBalance: number;
  income: number;
  expense: number;
  balance: number;
};

function sumByType(transactions: TransactionLike[], currency: Currency, type: TransactionType) {
  return transactions
    .filter((transaction) => transaction.currency === currency && transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);
}

/**
 * Saldo berjalan satu mata uang:
 * saldo = saldo awal + pemasukan - pengeluaran (semua dalam mata uang yang sama).
 */
export function summarizeCurrency(
  currency: Currency,
  initialBalance: number,
  transactions: TransactionLike[],
): BalanceSummary {
  const income = sumByType(transactions, currency, "income");
  const expense = sumByType(transactions, currency, "expense");

  return {
    currency,
    initialBalance,
    income,
    expense,
    balance: initialBalance + income - expense,
  };
}

export function summarizeAll(
  initialBalances: Record<Currency, number>,
  transactions: TransactionLike[],
): BalanceSummary[] {
  return (Object.keys(initialBalances) as Currency[]).map((currency) =>
    summarizeCurrency(currency, initialBalances[currency] ?? 0, transactions),
  );
}

export function totalByType(
  transactions: TransactionLike[],
  type: TransactionType,
  currency: Currency,
): number {
  return sumByType(transactions, currency, type);
}
