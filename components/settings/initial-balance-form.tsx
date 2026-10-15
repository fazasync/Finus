"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { formatExchangeRate, type Currency } from "@/lib/currency";
import { fetchBalances, saveInitialBalances } from "@/lib/data/balances";
import { parseAmount, validateInitialBalance } from "@/lib/validation";
import { useAsyncData } from "@/hooks/use-async-data";
import type { Balance } from "@/types";

type Entry = { currency: Currency; initialBalance: number };
type EntryState = Record<Currency, { value: string; error: string | null }>;

const CURRENCIES = ["IDR", "MYR"] as const;

function initialEntries(balances: Balance[]): EntryState {
  const next: EntryState = {
    IDR: { value: "", error: null },
    MYR: { value: "", error: null },
  };

  for (const balance of balances) {
    next[balance.currency as Currency] = {
      value: String(balance.initial_balance),
      error: null,
    };
  }

  return next;
}

/**
 * Kunci untuk me-remount field setelah saldo tersimpan, sehingga nilai input
 * selalu berbasis data terbaru tanpa setState di dalam effect.
 */
function balancesKey(balances: Balance[]): string {
  return balances.map((balance) => `${balance.currency}=${balance.initial_balance}`).join("&");
}

function InitialBalanceFields({
  balances,
  submitting,
  onReview,
}: {
  balances: Balance[];
  submitting: boolean;
  onReview: (entries: Entry[]) => void;
}) {
  const [entries, setEntries] = useState<EntryState>(() => initialEntries(balances));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEntries: EntryState = { ...entries };
    const toSave: Entry[] = [];
    let invalid = false;

    for (const currency of CURRENCIES) {
      const validationError = validateInitialBalance(entries[currency].value);
      nextEntries[currency] = { ...nextEntries[currency], error: validationError };

      if (validationError) {
        invalid = true;
        continue;
      }

      toSave.push({ currency, initialBalance: parseAmount(entries[currency].value) });
    }

    setEntries(nextEntries);

    if (invalid) return;

    onReview(toSave);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {CURRENCIES.map((currency) => (
        <Input
          key={currency}
          label={`Saldo awal ${currency}`}
          inputMode="decimal"
          placeholder={currency === "IDR" ? "0" : "0.00"}
          value={entries[currency].value}
          onChange={(event) =>
            setEntries((current) => ({
              ...current,
              [currency]: { value: event.target.value, error: null },
            }))
          }
          error={entries[currency].error}
          hint={currency === "MYR" ? "Boleh desimal, mis. 350.50" : "Angka tanpa desimal"}
        />
      ))}

      <div>
        <Button type="submit" loading={submitting} loadingLabel="Menyimpan...">
          Simpan saldo awal
        </Button>
      </div>
    </form>
  );
}

export function InitialBalanceForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const { data: balances, loading, error, reload } = useAsyncData<Balance[]>(fetchBalances);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEntries, setPendingEntries] = useState<Entry[]>([]);

  function handleReview(toSave: Entry[]) {
    if (!user) {
      showError("Sesi tidak ditemukan. Silakan masuk kembali.");
      return;
    }

    const original = new Map(
      (balances ?? []).map((balance) => [balance.currency as Currency, balance.initial_balance]),
    );

    const hasChanges = toSave.some((entry) => {
      const current = original.get(entry.currency);
      return current === undefined || current !== entry.initialBalance;
    });

    if (!hasChanges) {
      showError("Tidak ada perubahan saldo awal.");
      return;
    }

    setPendingEntries(toSave);
    setShowConfirm(true);
  }

  async function handleConfirmSave() {
    if (!user) return;

    setSubmitting(true);
    try {
      await saveInitialBalances(user.id, pendingEntries);
      showSuccess("Saldo awal disimpan.");
      setShowConfirm(false);
      reload();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Gagal menyimpan saldo awal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Saldo Awal"
          description="Atur saldo awal per mata uang. Perubahan saldo awal akan memperbarui saldo berjalan keseluruhan."
        />
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat saldo...</p>
          ) : error ? (
            <p role="alert" className="text-sm text-expense">
              {error}
            </p>
          ) : balances ? (
            <InitialBalanceFields
              key={balancesKey(balances)}
              balances={balances}
              submitting={submitting}
              onReview={handleReview}
            />
          ) : null}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirm}
        title="Perbarui saldo awal?"
        description="Mengubah saldo awal akan memengaruhi saldo berjalan dan angka laporan secara keseluruhan. Lanjutkan?"
        confirmLabel="Simpan"
        cancelLabel="Batal"
        tone="primary"
        loading={submitting}
        onConfirm={handleConfirmSave}
        onClose={() => setShowConfirm(false)}
      />
    </>
  );
}

export function ExchangeRateSummary({ rate }: { rate: number | null }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5">
      <p className="text-sm text-muted-foreground">Kurs saat ini</p>
      <p className="text-base font-semibold text-foreground">
        {rate ? formatExchangeRate(rate) : "Belum diatur"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Kurs selalu berarti jumlah Rupiah untuk 1 Ringgit.
      </p>
    </div>
  );
}
