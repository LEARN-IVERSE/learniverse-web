"use client";

import { useCallback, useEffect, useState } from "react";

export type Loadable<T> =
  { status: "loading" } | { status: "error"; notFound: boolean } | { status: "ready"; data: T };

type Result<T> = { data?: T; response?: Response };

/** Load data from the generated API client once per `key`; `retry` loads it again. */
export function useApi<T>(key: string, load: () => Promise<Result<T>>): [Loadable<T>, () => void] {
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void load().then(({ data, response }) => {
      if (cancelled) return;
      if (data !== undefined) setState({ status: "ready", data });
      else setState({ status: "error", notFound: response?.status === 404 });
    });
    return () => {
      cancelled = true;
    };
    // `load` is recreated every render; `key` identifies what it loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);
  return [state, retry];
}
