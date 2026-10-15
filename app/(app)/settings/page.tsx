"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import {
  CurrencyPreferenceForm,
  ExchangeRateForm,
} from "@/components/settings/preference-forms";
import { InitialBalanceForm } from "@/components/settings/initial-balance-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { fetchLatestExchangeRate } from "@/lib/data/exchange-rates";
import { fetchProfile } from "@/lib/data/profile";
import { useAsyncData } from "@/hooks/use-async-data";
import type { ExchangeRate, Profile } from "@/types";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { showError } = useToast();
  const [signingOut, setSigningOut] = useState(false);

  const state = useAsyncData<{ profile: Profile; rate: ExchangeRate | null }>(async () => {
    if (!user) {
      throw new Error("Sesi tidak ditemukan.");
    }

    const [profile, rate] = await Promise.all([
      fetchProfile(user.id),
      fetchLatestExchangeRate(),
    ]);

    return { profile, rate };
  });

  async function handleLogout() {
    setSigningOut(true);
    const { error } = await signOut();

    if (error) {
      showError(error);
      setSigningOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <PageHeader title="Pengaturan" description="Saldo awal, kurs, dan preferensi akun." />

      {state.loading ? <LoadingState /> : null}

      {state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : null}

      {state.data ? (
        <div className="flex flex-col gap-5">
          <InitialBalanceForm />

          <CurrencyPreferenceForm profile={state.data.profile} onSaved={state.reload} />

          <ExchangeRateForm
            profile={state.data.profile}
            currentRate={state.data.rate?.rate ?? null}
            onSaved={state.reload}
          />

          <Card>
            <CardHeader title="Akun" description="Informasi akun yang sedang masuk." />
            <CardContent className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email ?? "-"}</p>
              </div>
              <div>
                <Button variant="secondary" onClick={handleLogout} loading={signingOut} loadingLabel="Keluar...">
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
