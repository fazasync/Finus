"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { convertIdrToMyr, convertMyrToIdr, formatApprox, formatCurrency, type Currency } from "@/lib/currency";
import { fromDateTimeLocalValue, toDateTimeLocalValue } from "@/lib/date";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { createTransaction, updateTransaction, type TransactionInput } from "@/lib/data/transactions";
import { parseAmount, validateAmount, validateDescription, validateRate } from "@/lib/validation";
import type { Category, Profile, TransactionType, TransactionWithCategory } from "@/types";

type FormErrors = {
  description?: string | null;
  categoryId?: string | null;
  amount?: string | null;
  transactionAt?: string | null;
  rate?: string | null;
};

export function TransactionForm({
  mode,
  profile,
  categories,
  currentRate,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  profile: Profile;
  categories: Category[];
  currentRate: number | null;
  initial?: TransactionWithCategory;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [amountValue, setAmountValue] = useState(
    initial ? String(initial.amount).replace(".", ",") : "",
  );
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? profile.base_currency);
  const [transactionAt, setTransactionAt] = useState(() =>
    toDateTimeLocalValue(initial ? new Date(initial.transaction_at) : new Date(), profile.timezone),
  );
  const [rateValue, setRateValue] = useState(() => {
    if (initial?.exchange_rate) return String(initial.exchange_rate);
    if (currentRate) return String(currentRate);
    return "";
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.type === type)
        .map((category) => ({ value: category.id, label: category.name })),
    [categories, type],
  );

  const needsRate = currency !== profile.base_currency;
  const parsedRate = needsRate ? parseAmount(rateValue) : Number.NaN;
  const parsedAmount = parseAmount(amountValue);
  const conversionPreview =
    needsRate && Number.isFinite(parsedRate) && parsedRate > 0 && Number.isFinite(parsedAmount)
      ? currency === "MYR"
        ? formatApprox(convertMyrToIdr(parsedAmount, parsedRate), "IDR")
        : formatApprox(convertIdrToMyr(parsedAmount, parsedRate), "MYR")
      : null;

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setCategoryId((current) =>
      categories.some((category) => category.id === current && category.type === nextType)
        ? current
        : "",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const nextErrors: FormErrors = {
      description: validateDescription(description),
      categoryId: categoryId ? null : "Kategori wajib dipilih.",
      amount: validateAmount(amountValue),
      transactionAt: fromDateTimeLocalValue(transactionAt, profile.timezone)
        ? null
        : "Tanggal dan waktu tidak valid.",
      rate: needsRate ? validateRate(rateValue) : null,
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const at = fromDateTimeLocalValue(transactionAt, profile.timezone);
    if (!at) return;

    const input: TransactionInput = {
      categoryId,
      type,
      description: description.trim(),
      amount: parseAmount(amountValue),
      currency,
      exchangeRate: needsRate ? parseAmount(rateValue) : null,
      transactionAtIso: at.toISOString(),
    };

    setSubmitting(true);
    try {
      if (mode === "create") {
        if (!user) throw new Error("Sesi tidak ditemukan.");
        await createTransaction(user.id, input);
        showSuccess("Transaksi disimpan.");
      } else if (initial) {
        await updateTransaction(initial.id, input);
        showSuccess("Transaksi diperbarui.");
      }
      onSuccess();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Gagal menyimpan transaksi.";
      setFormError(message);
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <fieldset>
        <legend className="field-label">Jenis transaksi</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as TransactionType[]).map((option) => {
            const active = type === option;
            const label = option === "expense" ? "Pengeluaran" : "Pemasukan";

            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => handleTypeChange(option)}
                className={`h-11 rounded-lg border text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  active
                    ? option === "expense"
                      ? "border-expense bg-expense-soft text-expense"
                      : "border-income bg-income-soft text-income"
                    : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Input
        label="Keterangan"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        error={errors.description}
        placeholder="mis. Makan siang"
        required
      />

      <Select
        label="Kategori"
        value={categoryId}
        onChange={(event) => setCategoryId(event.target.value)}
        options={categoryOptions}
        placeholder={categoryOptions.length ? "Pilih kategori" : "Belum ada kategori"}
        error={errors.categoryId}
        disabled={categoryOptions.length === 0}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nominal"
          inputMode="decimal"
          value={amountValue}
          onChange={(event) => setAmountValue(event.target.value)}
          error={errors.amount}
          placeholder="0"
          required
        />

        <Select
          label="Mata uang"
          value={currency}
          onChange={(event) => setCurrency(event.target.value as Currency)}
          options={[
            { value: "IDR", label: "IDR — Rupiah" },
            { value: "MYR", label: "MYR — Ringgit Malaysia" },
          ]}
        />
      </div>

      <Input
        label="Tanggal & waktu"
        type="datetime-local"
        value={transactionAt}
        onChange={(event) => setTransactionAt(event.target.value)}
        error={errors.transactionAt}
        hint={`Waktu mengikuti zona ${profile.timezone}.`}
        required
      />

      {needsRate ? (
        <div className="rounded-lg border border-border bg-surface-muted px-3 py-3">
          <Input
            label="Kurs transaksi (IDR per 1 MYR)"
            inputMode="decimal"
            value={rateValue}
            onChange={(event) => setRateValue(event.target.value)}
            error={errors.rate}
            hint="Disimpan sebagai snapshot pada transaksi ini."
          />
          {conversionPreview ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Perkiraan: <span className="font-medium text-foreground">{conversionPreview}</span> pada kurs{" "}
              {formatCurrency(parsedRate, "IDR")} per 1 MYR.
            </p>
          ) : null}
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="rounded-lg border border-expense/30 bg-expense-soft px-3 py-2 text-sm text-expense">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={submitting} loadingLabel="Menyimpan...">
          {mode === "create" ? "Simpan transaksi" : "Perbarui transaksi"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
