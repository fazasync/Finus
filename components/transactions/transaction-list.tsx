"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { formatDateTimeInTimeZone } from "@/lib/date";
import type { TransactionWithCategory } from "@/types";

export function TransactionTypeBadge({ type }: { type: "income" | "expense" }) {
  return (
    <Badge tone={type === "income" ? "income" : "expense"}>
      {type === "income" ? "Pemasukan" : "Pengeluaran"}
    </Badge>
  );
}

export function TransactionAmount({ transaction }: { transaction: TransactionWithCategory }) {
  const sign = transaction.type === "income" ? "+" : "−";
  return (
    <span
      className={`font-semibold ${
        transaction.type === "income" ? "text-income" : "text-expense"
      }`}
    >
      {sign} {formatCurrency(transaction.amount, transaction.currency)}
    </span>
  );
}

function TransactionActions({
  transaction,
  onDelete,
}: {
  transaction: TransactionWithCategory;
  onDelete: (transaction: TransactionWithCategory) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/app/transactions/${transaction.id}/edit`}
        className="rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={() => onDelete(transaction)}
        className="rounded-md px-2 py-1 text-sm font-medium text-expense hover:bg-expense-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/40"
      >
        Hapus
      </button>
    </div>
  );
}

export function TransactionCard({
  transaction,
  timeZone,
  onDelete,
}: {
  transaction: TransactionWithCategory;
  timeZone: string;
  onDelete: (transaction: TransactionWithCategory) => void;
}) {
  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{transaction.description}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDateTimeInTimeZone(transaction.transaction_at, timeZone)}
            {" · "}
            {transaction.category?.name ?? "Tanpa kategori"}
          </p>
          <div className="mt-2">
            <TransactionTypeBadge type={transaction.type} />
          </div>
        </div>
        <div className="text-right">
          <TransactionAmount transaction={transaction} />
          {transaction.exchange_rate ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Kurs: {formatCurrency(transaction.exchange_rate, "IDR")} / MYR
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-2">
        <TransactionActions transaction={transaction} onDelete={onDelete} />
      </div>
    </li>
  );
}

export function TransactionTable({
  transactions,
  timeZone,
  onDelete,
}: {
  transactions: TransactionWithCategory[];
  timeZone: string;
  onDelete: (transaction: TransactionWithCategory) => void;
}) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">Daftar transaksi</caption>
        <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Tanggal
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Keterangan
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Kategori
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Jenis
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Nominal
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {formatDateTimeInTimeZone(transaction.transaction_at, timeZone)}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">{transaction.description}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {transaction.category?.name ?? "Tanpa kategori"}
              </td>
              <td className="px-4 py-3">
                <TransactionTypeBadge type={transaction.type} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <TransactionAmount transaction={transaction} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  <TransactionActions transaction={transaction} onDelete={onDelete} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
