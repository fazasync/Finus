"use client";

import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mapAuthError } from "@/lib/supabase/auth-errors";

type AuthResult = {
  error: string | null;
};

type SignUpResult = AuthResult & {
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const NOT_CONFIGURED_MESSAGE =
  "Supabase belum dikonfigurasi. Hubungi pengelola aplikasi untuk menyiapkan .env.local.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!configured) {
        return { error: NOT_CONFIGURED_MESSAGE };
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          return { error: mapAuthError(error.message) };
        }

        return { error: null };
      } catch {
        return { error: "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi." };
      }
    },
    [configured],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
      if (!configured) {
        return { error: NOT_CONFIGURED_MESSAGE, needsEmailConfirmation: false };
      }

      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          return { error: mapAuthError(error.message), needsEmailConfirmation: false };
        }

        return { error: null, needsEmailConfirmation: data.session === null };
      } catch {
        return {
          error: "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
          needsEmailConfirmation: false,
        };
      }
    },
    [configured],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!configured) {
      return { error: NOT_CONFIGURED_MESSAGE };
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: mapAuthError(error.message) };
      }

      return { error: null };
    } catch {
      return { error: "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi." };
    }
  }, [configured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, configured, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider.");
  }

  return context;
}
