"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">Terjadi kesalahan</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {error.message || "Halaman gagal dimuat. Silakan coba lagi."}
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        Coba lagi
      </Button>
    </div>
  );
}
