"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatExchangeRate, type Currency } from "@/lib/currency";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/components/ui/toast";
import { fetchBalances, setInitialBalances } from "@/lib/data/balances";
import { parseAmount, validateInitialBalance } from "@/lib/validation";
import type { Balance } from "@/types";

type EntryState = Record<Currency, { value: string; error: string | null }>;

const EMPTY_ENTRY_STATE: EntryState = {
  IDR: { value: "", error: null },
  MYR: { value: "", error: null },
};

export function InitialBalanceForm() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const { data: balances, loading, error, reload } = useAsyncData<Balance[]>(fetchBalances);
  const [entries, setEntries] = useState<EntryState>(EMPTY_ENTRY_STATE);
  const [submitting, setSubmitting] = useState(false);

  const existing = new Set((balances ?? []).map((balance) => balance.currency as Currency));
  const byCurrency = new Map((balances ?? []).map((balance) => [balance.currency, balance]));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    const nextEntries: EntryState = { ...entries };
    const toSave: Array<{ currency: Currency; initialBalance: number }> = [];
    let invalid = false;

    (["IDR", "MYR"] as Currency[]).forEach((currency) => {
      if (existing.has(currency)) return;

      const validationError = validateInitialBalance(entries[currency].value);
      nextEntries[currency] = { ...nextEntries[currency], error: validationError };

      if (validationError) {
        invalid = true;
        return;
      }

      toSave.push({
        currency,
        initialBalance: parseAmount(entries[currency].value),
      });
    });

    setEntries(nextEntries);

    if (invalid || toSave.length === 0) {
      if (toSave.length === 0 && !invalid) {
        showError("Tidak ada saldo awal baru untuk disimpan.");
      }
      return;
    }

    setSubmitting(true);
    try {
      await setInitialBalances(user.id, [...existing], toSave);
      showSuccess("Saldo awal disimpan.");
      reload();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Gagal menyimpan saldo awal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Saldo Awal"
        description="Diisi satu kali per mata uang. Setelah tersimpan, saldo hanya berubah melalui transaksi."
      />
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat saldo...</p>
        ) : error ? (
          <p role="alert" className="text-sm text-expense">
            {error}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {(["IDR", "MYR"] as Currency[]).map((currency) => {
              const balance = byCurrency.get(currency);
              const isSet = existing.has(currency);

              if (isSet && balance) {
                return (
                  <div key={currency} className="rounded-lg border border-border bg-surface-muted px-3 py-2.5">
                    <p className="text-sm text-muted-foreground">Saldo awal {currency}</p>
                    <p className="text-base font-semibold text-foreground">
                      {formatCurrency(balance.initial_balance, currency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Sudah diisi dan tidak dapat diubah dari halaman ini.
                    </p>
                  </div>
                );
              }

              return (
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
              );
            })}

            <div>
              <Button type="submit" loading={submitting} loadingLabel="Menyimpan...">
                Simpan saldo awal
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
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
