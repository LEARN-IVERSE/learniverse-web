"use client";

import { useRouter } from "next/navigation";
import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from "react";

import { authMe, authSignOut, type MeOut } from "@/lib/api-client";

export type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "error" }
  | { status: "signing-out" }
  | { status: "signed-in"; user: MeOut };

type SessionContextValue = {
  state: SessionState;
  refresh: () => void;
  /** The API accepted a sign-in: adopt that account right away, so no page ever sees a stale "guest". */
  signIn: (user: MeOut) => void;
  /** The sign-in page is showing: a finished sign-out is now just "guest". */
  settleSignOut: () => void;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Who is signed in, as told by GET /api/v1/me. The API stays the only authority on access.
 *
 * It lives in the root layout, ABOVE both /login and the learner pages. When it sat inside the (app) layout,
 * the production build kept that layout's old state while the learner was on /login: a visitor who opened a
 * page signed out and then signed in came back to a stale "guest", was sent to /login again, and bounced
 * between the two pages forever.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void authMe().then(({ data, response }) => {
      if (cancelled) return;
      if (data) setState({ status: "signed-in", user: data });
      else setState(response?.status === 401 ? { status: "guest" } : { status: "error" });
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const refresh = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const signIn = useCallback((user: MeOut) => setState({ status: "signed-in", user }), []);

  const settleSignOut = useCallback(
    () => setState((current) => (current.status === "signing-out" ? { status: "guest" } : current)),
    [],
  );

  const signOut = useCallback(async () => {
    // "signing-out" (not "guest") so the session gate does not race us with its own
    // "?next=<this page>" redirect: the next person to sign in starts fresh.
    setState({ status: "signing-out" });
    await authSignOut();
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ state, refresh, signIn, settleSignOut, signOut }),
    [state, refresh, signIn, settleSignOut, signOut],
  );
  return <SessionContext value={value}>{children}</SessionContext>;
}

/** Session of the nearest provider, or null on pages rendered without one. */
export function useSession(): SessionContextValue | null {
  return use(SessionContext);
}
