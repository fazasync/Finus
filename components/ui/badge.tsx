import type { ReactNode } from "react";

type BadgeTone = "neutral" | "income" | "expense" | "primary" | "warning" | "outline";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted-foreground",
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  primary: "bg-primary-soft text-primary",
  warning: "bg-warning-soft text-warning",
  outline: "border border-border text-muted-foreground",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
