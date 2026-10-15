"use client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatCurrency, type Currency } from "@/lib/currency";
import type { CategoryExpense } from "@/lib/reports";

export function CategoryBreakdown({ categories }: { categories: CategoryExpense[] }) {
  if (categories.length === 0) {
    return (
      <EmptyState
        title="Belum ada pengeluaran"
        message="Tidak ada pengeluaran pada periode ini."
      />
    );
  }

  const currencyTotals = categories.reduce<Record<Currency, number>>(
    (totals, item) => {
      totals[item.currency] += item.total;
      return totals;
    },
    { IDR: 0, MYR: 0 },
  );

  return (
    <div className="flex flex-col gap-4">
      {(["IDR", "MYR"] as Currency[]).map((currency) => {
        const items = categories.filter((item) => item.currency === currency);

        if (items.length === 0) {
          return null;
        }

        return (
          <div key={currency}>
            <div className="mb-1 flex items-center justify-between">
              <Badge tone="primary">{currency}</Badge>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(currencyTotals[currency], currency)}
              </p>
            </div>
            <ul className="flex flex-col divide-y divide-border">
              {items.map((item) => (
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
          </div>
        );
      })}
    </div>
  );
}
