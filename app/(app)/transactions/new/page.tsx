"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useFormContext } from "@/hooks/use-form-context";

export default function NewTransactionPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useFormContext();

  return (
    <>
      <PageHeader title="Tambah transaksi" description="Catat pemasukan atau pengeluaran baru." />

      <Card>
        <CardContent>
          {loading ? <LoadingState label="Menyiapkan form..." /> : null}
          {error ? <ErrorState message={error} onRetry={reload} /> : null}
          {data ? (
            <TransactionForm
              mode="create"
              profile={data.profile}
              categories={data.categories}
              currentRate={data.rate?.rate ?? null}
              onSuccess={() => router.push("/app/transactions")}
              onCancel={() => router.push("/app/transactions")}
            />
          ) : null}
        </CardContent>
      </Card>
    </>
  );
}
