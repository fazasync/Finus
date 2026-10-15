"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  TransactionCard,
  TransactionTable,
} from "@/components/transactions/transaction-list";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { deleteTransaction, fetchTransactionPage } from "@/lib/data/transactions";
import { fetchCategories } from "@/lib/data/categories";
import { startOfNextDayInTimeZone, zonedTimeToUtc } from "@/lib/date";
import { useAsyncData } from "@/hooks/use-async-data";
import { useFormContext } from "@/hooks/use-form-context";
import type { Currency, TransactionType, TransactionWithCategory } from "@/types";

const PAGE_SIZE = 20;

type Filters = {
  search: string;
  from: string;
  to: string;
  categoryId: string;
  type: TransactionType | "";
  currency: Currency | "";
  order: "newest" | "oldest";
};

const EMPTY_FILTERS: Filters = {
  search: "",
  from: "",
  to: "",
  categoryId: "",
  type: "",
  currency: "",
  order: "newest",
};

function toPeriodIso(dateValue: string, timeZone: string, end: boolean): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!match) return undefined;

  const [, year, month, day] = match.map(Number);
  const date = zonedTimeToUtc(year, month, day, 0, 0, timeZone);

  if (end) {
    return startOfNextDayInTimeZone(date, timeZone).toISOString();
  }

  return date.toISOString();
}

export default function TransactionsPage() {
  const context = useFormContext();
  const categories = useAsyncData(fetchCategories);
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<TransactionWithCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const timeZone = context.data?.profile.timezone ?? "UTC";

  const queryKey = `${timeZone}|${page}|${JSON.stringify(appliedFilters)}`;

  const transactionsQuery = useAsyncData(
    () =>
      fetchTransactionPage({
        search: appliedFilters.search,
        fromIso: toPeriodIso(appliedFilters.from, timeZone, false),
        toIso: toPeriodIso(appliedFilters.to, timeZone, true),
        categoryId: appliedFilters.categoryId || undefined,
        type: appliedFilters.type || undefined,
        currency: appliedFilters.currency || undefined,
        order: appliedFilters.order,
        page,
        pageSize: PAGE_SIZE,
      }),
    queryKey,
  );

  const hasActiveFilters = useMemo(
    () => JSON.stringify(appliedFilters) !== JSON.stringify(EMPTY_FILTERS),
    [appliedFilters],
  );

  const totalPages = transactionsQuery.data
    ? Math.max(1, Math.ceil(transactionsQuery.data.count / PAGE_SIZE))
    : 1;

  function applyFilters() {
    setAppliedFilters(filters);
    setPage(0);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(0);
  }

  async function handleDelete() {
    if (!pendingDelete || !user) return;

    setDeleting(true);
    try {
      await deleteTransaction(pendingDelete.id);
      showSuccess("Transaksi dihapus.");
      setPendingDelete(null);
      transactionsQuery.reload();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Gagal menghapus transaksi.");
    } finally {
      setDeleting(false);
    }
  }

  const categoryOptions = (categories.data ?? []).map((category) => ({
    value: category.id,
    label: `${category.name} (${category.type === "income" ? "pemasukan" : "pengeluaran"})`,
  }));

  const items = transactionsQuery.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Riwayat transaksi"
        description="Cari, filter, dan kelola transaksi Anda."
        actions={
          <Link href="/app/transactions/new" className={buttonClasses("primary", "md")}>
            Tambah transaksi
          </Link>
        }
      />

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Cari keterangan"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="mis. makan"
            />
            <Select
              label="Kategori"
              value={filters.categoryId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, categoryId: event.target.value }))
              }
              options={categoryOptions}
              placeholder="Semua kategori"
            />
            <Input
              label="Dari tanggal"
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
            />
            <Input
              label="Sampai tanggal"
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
            />
            <Select
              label="Jenis"
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({ ...current, type: event.target.value as Filters["type"] }))
              }
              options={[
                { value: "income", label: "Pemasukan" },
                { value: "expense", label: "Pengeluaran" },
              ]}
              placeholder="Semua jenis"
            />
            <Select
              label="Mata uang"
              value={filters.currency}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  currency: event.target.value as Filters["currency"],
                }))
              }
              options={[
                { value: "IDR", label: "IDR" },
                { value: "MYR", label: "MYR" },
              ]}
              placeholder="Semua mata uang"
            />
            <Select
              label="Urutan"
              value={filters.order}
              onChange={(event) =>
                setFilters((current) => ({ ...current, order: event.target.value as Filters["order"] }))
              }
              options={[
                { value: "newest", label: "Terbaru dulu" },
                { value: "oldest", label: "Terlama dulu" },
              ]}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={applyFilters}>Terapkan filter</Button>
            <Button variant="secondary" onClick={resetFilters} disabled={!hasActiveFilters}>
              Reset filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {transactionsQuery.loading ? <LoadingState /> : null}
      {transactionsQuery.error ? <ErrorState message={transactionsQuery.error} onRetry={transactionsQuery.reload} /> : null}

      {!transactionsQuery.loading && !transactionsQuery.error && items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Tidak ada hasil"
            message="Tidak ada transaksi yang cocok dengan filter Anda. Coba ubah atau reset filter."
            action={
              <Button variant="secondary" onClick={resetFilters}>
                Reset filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Belum ada transaksi"
            message="Mulai catat pemasukan atau pengeluaran pertama Anda."
            action={
              <Link href="/app/transactions/new" className={buttonClasses("primary", "md")}>
                Tambah transaksi
              </Link>
            }
          />
        )
      ) : null}

      {items.length > 0 ? (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {items.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                timeZone={timeZone}
                onDelete={setPendingDelete}
              />
            ))}
          </ul>

          <div className="hidden md:block">
            <TransactionTable
              transactions={items}
              timeZone={timeZone}
              onDelete={setPendingDelete}
            />
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
              >
                Sebelumnya
              </Button>
              <p className="text-sm text-muted-foreground">
                Halaman {page + 1} dari {totalPages}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={page >= totalPages - 1}
              >
                Berikutnya
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus transaksi?"
        description={
          pendingDelete
            ? `"${pendingDelete.description}" akan dihapus permanen dan saldo akan dihitung ulang.`
            : ""
        }
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}
