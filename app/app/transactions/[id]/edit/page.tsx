"use client";

import { useRouter } from "next/navigation";
import { use } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { fetchTransactionById } from "@/lib/data/transactions";
import { useFormContext } from "@/hooks/use-form-context";
import { useAsyncData } from "@/hooks/use-async-data";
import type { TransactionWithCategory } from "@/types";

export default function EditTransactionPage({ params }: PageProps<"/app/transactions/[id]/edit">) {
  const router = useRouter();
  const context = useFormContext();
  const { id } = use(params);
  const transaction = useAsyncData<TransactionWithCategory | null>(() => fetchTransactionById(id));

  const loading = context.loading || transaction.loading;
  const error = context.error ?? transaction.error;

  return (
    <>
      <PageHeader title="Edit transaksi" description="Perbarui data transaksi milik Anda." />

      <Card>
        <CardContent>
          {loading ? <LoadingState label="Memuat transaksi..." /> : null}
          {error ? (
            <ErrorState
              message={error}
              onRetry={() => {
                context.reload();
                transaction.reload();
              }}
            />
          ) : null}
          {!loading && !error && transaction.data === null ? (
            <ErrorState title="Transaksi tidak ditemukan" message="Data mungkin sudah dihapus." />
          ) : null}
          {context.data && transaction.data ? (
            <TransactionForm
              mode="edit"
              profile={context.data.profile}
              categories={context.data.categories}
              currentRate={context.data.rate?.rate ?? null}
              initial={transaction.data}
              onSuccess={() => router.push("/app/transactions")}
              onCancel={() => router.push("/app/transactions")}
            />
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
