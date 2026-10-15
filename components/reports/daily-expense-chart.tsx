"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency, type Currency } from "@/lib/currency";
import { formatDayLabel } from "@/lib/date";
import type { DailyExpense } from "@/lib/reports";

export function DailyExpenseChart({
  daily,
  timeZone,
}: {
  daily: DailyExpense[];
  timeZone: string;
}) {
  const [currency, setCurrency] = useState<Currency>("IDR");

  const data = daily.map((entry) => ({
    day: formatDayLabel(entry.day, timeZone),
    value: entry.totals[currency],
  }));

  const hasData = data.some((entry) => entry.value > 0);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Tampilkan dalam</span>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["IDR", "MYR"] as Currency[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCurrency(option)}
              aria-pressed={currency === option}
              className={`rounded-md px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                currency === option ? "bg-primary-soft text-primary" : "text-muted-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={72} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value), currency)}
                labelFormatter={(label) => `Hari ${String(label)}`}
              />
              <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Belum ada pengeluaran {currency} pada tujuh hari terakhir.
        </p>
      )}
    </div>
  );
}
