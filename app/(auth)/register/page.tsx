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

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, configured, signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<{
    email?: string | null;
    password?: string | null;
    passwordConfirm?: string | null;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

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
    const confirmError =
      password !== passwordConfirm ? "Konfirmasi password tidak sama." : null;

    setErrors({ email: emailError, password: passwordError, passwordConfirm: confirmError });

    if (emailError || passwordError || confirmError) {
      return;
    }

    setSubmitting(true);
    const result = await signUp(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setConfirmationSent(true);
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
                Registrasi belum bisa dipakai sebelum kredensial Supabase diisi pada{" "}
                <code className="font-mono text-xs">.env.local</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (confirmationSent) {
    return (
      <Card>
        <CardContent>
          <h1 className="text-lg font-semibold text-foreground">Periksa email Anda</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kami mengirim tautan konfirmasi ke <strong>{email.trim()}</strong>. Buka tautan
            tersebut, lalu masuk ke akun Anda.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Kembali ke halaman masuk
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <h1 className="text-lg font-semibold text-foreground">Daftar akun</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buat akun untuk mulai mencatat keuangan Anda.
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
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint="Minimal 6 karakter."
            error={errors.password}
            required
          />
          <Input
            label="Konfirmasi password"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            error={errors.passwordConfirm}
            required
          />

          {formError ? (
            <p role="alert" className="rounded-lg border border-expense/30 bg-expense-soft px-3 py-2 text-sm text-expense">
              {formError}
            </p>
          ) : null}

          <Button type="submit" loading={submitting} loadingLabel="Mendaftar...">
            Daftar
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
