import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-semibold text-foreground">Finus</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pencatat keuangan pribadi IDR &amp; MYR
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
