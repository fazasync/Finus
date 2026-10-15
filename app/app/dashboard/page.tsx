"use client";

import Link from "next/link";
import { useMemo } from "react";

import { DailyExpenseChart } from "@/components/reports/daily-expense-chart";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { TransactionAmount } from "@/components/transactions/transaction-list";
import { summarizeAll } from "@/lib/balance";
import { formatApprox, formatCurrency, formatExchangeRate, type Currency } from "@/lib/currency";
import {
  formatDateInTimeZone,
  startOfDayInTimeZone,
  startOfNextDayInTimeZone,
  weeklyPeriod,
} from "@/lib/date";
import { buildWeeklyReport } from "@/lib/reports";
import { fetchBalances } from "@/lib/data/balances";
import { fetchLatestExchangeRate } from "@/lib/data/exchange-rates";
import { fetchProfile } from "@/lib/data/profile";
import { fetchAllTransactions } from "@/lib/data/transactions";
import { useAsyncData } from "@/hooks/use-async-data";
import type { TransactionWithCategory } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();

  const query = useAsyncData(async () => {
    if (!user) {
      throw new Error("Sesi tidak ditemukan.");
    }

    const [profile, balances, rate, transactions] = await Promise.all([
      fetchProfile(user.id),
      fetchBalances(),
      fetchLatestExchangeRate(),
      fetchAllTransactions(),
    ]);

    return { profile, balances, rate, transactions };
  });

  const derived = useMemo(() => {
    if (!query.data) return null;

    const { profile, balances, rate, transactions } = query.data;
    const initialBalances: Record<Currency, number> = { IDR: 0, MYR: 0 };

    for (const balance of balances) {
      initialBalances[balance.currency as Currency] = balance.initial_balance;
    }

    const summaries = summarizeAll(initialBalances, transactions);
    const period = weeklyPeriod(profile.timezone);
    const report = buildWeeklyReport({
      transactions,
      period,
      timeZone: profile.timezone,
      baseCurrency: profile.base_currency,
      rate: rate?.rate ?? null,
    });

    const dayStart = startOfDayInTimeZone(new Date(), profile.timezone);
    const dayEnd = startOfNextDayInTimeZone(new Date(), profile.timezone);
    const todayExpenses: Record<Currency, number> = { IDR: 0, MYR: 0 };

    for (const transaction of transactions) {
      if (transaction.type !== "expense") continue;
      const time = new Date(transaction.transaction_at).getTime();
      if (time >= dayStart.getTime() && time < dayEnd.getTime()) {
        todayExpenses[transaction.currency as Currency] += transaction.amount;
      }
    }

    return {
      profile,
      summaries,
      rate: rate?.rate ?? null,
      report,
      todayExpenses,
      recent: transactions.slice(0, 5),
      todayLabel: formatDateInTimeZone(new Date(), profile.timezone),
    };
  }, [query.data]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={derived ? `Hari ini, ${derived.todayLabel}` : undefined}
        actions={
          <Link href="/app/transactions/new" className={buttonClasses("primary", "md")}>
            Tambah transaksi
          </Link>
        }
      />

      {query.loading ? <LoadingState label="Memuat dashboard..." /> : null}
      {query.error ? <ErrorState message={query.error} onRetry={query.reload} /> : null}

      {derived ? (
        <div className="flex flex-col gap-5">
          <section aria-label="Saldo" className="grid gap-4 sm:grid-cols-2">
            {derived.summaries.map((summary) => (
              <Card key={summary.currency}>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Saldo {summary.currency}
                    </p>
                    <Badge tone="primary">{summary.currency}</Badge>
                  </div>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {formatCurrency(summary.balance, summary.currency)}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Pemasukan</dt>
                      <dd className="font-medium text-income">
                        {formatCurrency(summary.income, summary.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Pengeluaran</dt>
                      <dd className="font-medium text-expense">
                        {formatCurrency(summary.expense, summary.currency)}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Saldo awal {formatCurrency(summary.initialBalance, summary.currency)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>

          {derived.report.combined ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Total pengeluaran 7 hari (perkiraan dalam {derived.profile.base_currency})
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {formatApprox(derived.report.combined.value, derived.report.combined.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dihitung dengan kurs {formatExchangeRate(derived.report.combined.rate)}.
                </p>
              </CardContent>
            </Card>
          ) : null}

          <section aria-label="Ringkasan pengeluaran" className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">Pengeluaran hari ini</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {formatCurrency(derived.todayExpenses.IDR, "IDR")}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(derived.todayExpenses.MYR, "MYR")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">
                  Pengeluaran 7 hari terakhir
                </p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {formatCurrency(derived.report.totals.IDR, "IDR")}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(derived.report.totals.MYR, "MYR")}
                </p>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader
              title="Pengeluaran harian"
              description="Tujuh hari kalender terakhir pada zona waktu profil."
            />
            <CardContent>
              <DailyExpenseChart daily={derived.report.daily} timeZone={derived.profile.timezone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Ringkasan per kategori" description="Pengeluaran tujuh hari terakhir." />
            <CardContent>
              {derived.report.categories.length === 0 ? (
                <EmptyState title="Belum ada pengeluaran" message="Kategori akan muncul setelah ada transaksi pengeluaran." />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {derived.report.categories.map((item) => (
                    <li
                      key={`${item.categoryId}-${item.currency}`}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="text-sm text-foreground">{item.categoryName}</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(item.total, item.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Transaksi terbaru"
              action={
                <Link href="/app/transactions" className="text-sm font-medium text-primary hover:underline">
                  Lihat semua
                </Link>
              }
            />
            <CardContent>
              {derived.recent.length === 0 ? (
                <EmptyState
                  title="Belum ada transaksi"
                  message="Catat transaksi pertama Anda untuk melihat ringkasan di sini."
                  action={
                    <Link href="/app/transactions/new" className={buttonClasses("primary", "sm")}>
                      Tambah transaksi
                    </Link>
                  }
                />
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {derived.recent.map((transaction: TransactionWithCategory) => (
                    <li
                      key={transaction.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.category?.name ?? "Tanpa kategori"}
                        </p>
                      </div>
                      <TransactionAmount transaction={transaction} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
