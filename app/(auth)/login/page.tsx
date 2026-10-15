"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { AlertIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/states";
import { validateEmail, validatePassword } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, configured, signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/app/dashboard");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) {
      return;
    }

    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);

    if (error) {
      setFormError(error);
      return;
    }

    router.replace("/app/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LoadingState label="Memeriksa sesi..." />
        </CardContent>
      </Card>
    );
  }

  if (!configured) {
    return (
      <Card>
        <CardContent>
          <div role="alert" className="flex gap-3 text-sm">
            <AlertIcon className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium text-foreground">Supabase belum dikonfigurasi</p>
              <p className="mt-1 text-muted-foreground">
                Isi <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> pada{" "}
                <code className="font-mono text-xs">.env.local</code>, lalu jalankan ulang dev server.
                Panduan lengkap ada di <code className="font-mono text-xs">supabase/setup.md</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <h1 className="text-lg font-semibold text-foreground">Masuk ke akun</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gunakan email dan password akun Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            required
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              required
            />
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                className="size-4 rounded border-border accent-[var(--primary)]"
              />
              Tampilkan password
            </label>
          </div>

          {formError ? (
            <p role="alert" className="rounded-lg border border-expense/30 bg-expense-soft px-3 py-2 text-sm text-expense">
              {formError}
            </p>
          ) : null}

          <Button type="submit" loading={submitting} loadingLabel="Masuk...">
            Masuk
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Daftar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
