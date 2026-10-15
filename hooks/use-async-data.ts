"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncDataState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

type Status = "loading" | "success" | "error";

type State<T> = {
  status: Status;
  data: T | null;
  error: string | null;
};

/**
 * Menjalankan `loader` saat mount, setiap kali `key` berubah, dan setiap kali `reload()`
 * dipanggil. Data lama tetap ditampilkan sampai hasil baru tiba.
 */
export function useAsyncData<T>(loader: () => Promise<T>, key?: unknown): AsyncDataState<T> {
  const [state, setState] = useState<State<T>>({ status: "loading", data: null, error: null });
  const [version, setVersion] = useState(0);

  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const result = await loaderRef.current();
        if (active) {
          setState({ status: "success", data: result, error: null });
        }
      } catch (cause: unknown) {
        if (active) {
          setState({
            status: "error",
            data: null,
            error: cause instanceof Error ? cause.message : "Terjadi kesalahan.",
          });
        }
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [version, key]);

  const reload = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  return {
    data: state.data,
    loading: state.status === "loading",
    error: state.error,
    reload,
  };
}
