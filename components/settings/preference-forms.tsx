"use client";

import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatExchangeRate, type Currency } from "@/lib/currency";
import { formatDateTimeInTimeZone, TIMEZONE_OPTIONS } from "@/lib/date";
import { addExchangeRate, fetchExchangeRateHistory } from "@/lib/data/exchange-rates";
import { updateProfile } from "@/lib/data/profile";
import { useAsyncData } from "@/hooks/use-async-data";
import { useToast } from "@/components/ui/toast";
import { parseAmount, validateRate } from "@/lib/validation";
import type { ExchangeRate, Profile } from "@/types";

export function CurrencyPreferenceForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const { showSuccess, showError } = useToast();
  const [baseCurrency, setBaseCurrency] = useState<Currency>(profile.base_currency);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [submitting, setSubmitting] = useState(false);

  const changed = baseCurrency !== profile.base_currency || timezone !== profile.timezone;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await updateProfile(profile.id, { base_currency: baseCurrency, timezone });
      showSuccess("Preferensi disimpan.");
      onSaved();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Gagal menyimpan preferensi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Mata Uang Utama & Zona Waktu"
        description="Mata uang utama dipakai untuk total gabungan. Zona waktu menentukan batas hari dan periode laporan."
      />
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Select
            label="Mata uang utama"
            value={baseCurrency}
            onChange={(event) => setBaseCurrency(event.target.value as Currency)}
            options={[
              { value: "IDR", label: "IDR — Rupiah" },
              { value: "MYR", label: "MYR — Ringgit Malaysia" },
            ]}
          />

          <Select
            label="Zona waktu"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            options={TIMEZONE_OPTIONS}
          />

          <div>
            <Button type="submit" loading={submitting} loadingLabel="Menyimpan..." disabled={!changed}>
              Simpan preferensi
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ExchangeRateForm({
  profile,
  currentRate,
  onSaved,
}: {
  profile: Profile;
  currentRate: number | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const history = useAsyncData<ExchangeRate[]>(() => fetchExchangeRateHistory(5));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    const validationError = validateRate(value);
    setError(validationError);

    if (validationError) return;

    setSubmitting(true);
    try {
      await addExchangeRate(user.id, parseAmount(value));
      setValue("");
      showSuccess("Kurs baru disimpan. Transaksi lama tidak berubah.");
      history.reload();
      onSaved();
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : "Gagal menyimpan kurs.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Kurs"
        description="Kurs manual berupa jumlah IDR untuk 1 MYR. Setiap perubahan menambah riwayat baru."
      />
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface-muted px-3 py-2.5">
          <p className="text-sm text-muted-foreground">Kurs saat ini</p>
          <p className="text-base font-semibold text-foreground">
            {currentRate ? formatExchangeRate(currentRate) : "Belum diatur"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
          <Input
            label="Kurs baru (IDR per 1 MYR)"
            inputMode="decimal"
            placeholder="3500"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            error={error}
            containerClassName="flex-1"
          />
          <div className="sm:pt-7">
            <Button type="submit" loading={submitting} loadingLabel="Menyimpan...">
              Simpan kurs
            </Button>
          </div>
        </form>

        <div>
          <p className="text-sm font-medium text-foreground">Riwayat kurs</p>
          {history.loading ? (
            <p className="mt-1 text-sm text-muted-foreground">Memuat riwayat...</p>
          ) : history.error ? (
            <p role="alert" className="mt-1 text-sm text-expense">
              {history.error}
            </p>
          ) : (history.data ?? []).length === 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Belum ada riwayat kurs.</p>
          ) : (
            <ul className="mt-1 divide-y divide-border text-sm">
              {(history.data ?? []).map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-2 py-1.5">
                  <span className="font-medium text-foreground">{formatExchangeRate(item.rate)}</span>
                  <span className="text-muted-foreground">
                    {formatDateTimeInTimeZone(item.effective_at, profile.timezone)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
