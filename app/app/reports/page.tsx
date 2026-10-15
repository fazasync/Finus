"use client";

import { useMemo } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { CategoryBreakdown } from "@/components/reports/category-breakdown";
import { DailyExpenseChart } from "@/components/reports/daily-expense-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { formatApprox, formatCurrency, formatExchangeRate } from "@/lib/currency";
import { formatDateInTimeZone, weeklyPeriod } from "@/lib/date";
import { buildWeeklyReport } from "@/lib/reports";
import { fetchLatestExchangeRate } from "@/lib/data/exchange-rates";
import { fetchProfile } from "@/lib/data/profile";
import { fetchAllTransactions } from "@/lib/data/transactions";
import { useAsyncData } from "@/hooks/use-async-data";

export default function ReportsPage() {
  const { user } = useAuth();

  const query = useAsyncData(async () => {
    if (!user) {
      throw new Error("Sesi tidak ditemukan.");
    }

    const [profile, rate, transactions] = await Promise.all([
      fetchProfile(user.id),
      fetchLatestExchangeRate(),
      fetchAllTransactions(),
    ]);

    return { profile, rate, transactions };
  });

  const derived = useMemo(() => {
    if (!query.data) return null;

    const { profile, rate, transactions } = query.data;
    const period = weeklyPeriod(profile.timezone);

    return {
      profile,
      period,
      report: buildWeeklyReport({
        transactions,
        period,
        timeZone: profile.timezone,
        baseCurrency: profile.base_currency,
        rate: rate?.rate ?? null,
      }),
    };
  }, [query.data]);

  return (
    <>
      <PageHeader
        title="Laporan mingguan"
        description="Pengeluaran hari ini dan enam hari sebelumnya (zona waktu profil)."
      />

      {query.loading ? <LoadingState label="Menghitung laporan..." /> : null}
      {query.error ? <ErrorState message={query.error} onRetry={query.reload} /> : null}

      {derived ? (
        <div className="flex flex-col gap-5">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Periode</p>
              <p className="text-base font-semibold text-foreground">
                {formatDateInTimeZone(derived.period.start, derived.profile.timezone)} —{" "}
                {formatDateInTimeZone(
                  new Date(derived.period.end.getTime() - 1),
                  derived.profile.timezone,
                )}
              </p>
            </CardContent>
          </Card>

          <section aria-label="Total pengeluaran" className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">Total pengeluaran IDR</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatCurrency(derived.report.totals.IDR, "IDR")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">Total pengeluaran MYR</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatCurrency(derived.report.totals.MYR, "MYR")}
                </p>
              </CardContent>
            </Card>
          </section>

          {derived.report.combined ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Total gabungan (perkiraan dalam {derived.report.combined.currency})
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {formatApprox(derived.report.combined.value, derived.report.combined.currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Menggunakan kurs {formatExchangeRate(derived.report.combined.rate)}. Nilai asli tiap
                  mata uang tetap ditampilkan terpisah di atas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Total gabungan tidak ditampilkan karena kurs belum diatur. IDR dan MYR tetap
                  dihitung terpisah.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="Pengeluaran harian" description="Nilai per mata uang, tanpa digabung." />
            <CardContent>
              <DailyExpenseChart daily={derived.report.daily} timeZone={derived.profile.timezone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Rincian per kategori" description="Hanya transaksi pengeluaran pada periode ini." />
            <CardContent>
              <CategoryBreakdown categories={derived.report.categories} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
