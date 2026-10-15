import type { ReactNode } from "react";

import { buttonClasses } from "./button";

export function LoadingState({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span
        aria-hidden="true"
        className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Gagal memuat data",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {message ? <p className="max-w-sm text-sm text-muted-foreground">{message}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className={buttonClasses("secondary", "sm", "mt-2")}>
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {message ? <div className="max-w-sm text-sm text-muted-foreground">{message}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
