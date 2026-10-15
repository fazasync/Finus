import { formatCurrency, type Currency } from "@/lib/currency";

export function CurrencyAmount({
  value,
  currency,
  className,
}: {
  value: number;
  currency: Currency;
  className?: string;
}) {
  return <span className={className}>{formatCurrency(value, currency)}</span>;
}
