"use client";

import Script from "next/script";
import { useRef, useState } from "react";

import { authSignInGoogle, type MeOut } from "@/lib/api-client";

type CredentialResponse = { credential: string };
type GoogleId = {
  initialize: (config: { client_id: string; callback: (r: CredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function errorMessage(error: unknown): string {
  const message = (error as { error?: { message?: unknown } } | undefined)?.error?.message;
  return typeof message === "string" ? message : "Đăng nhập chưa thành công. Bạn thử lại nhé.";
}

/**
 * "Sign in with Google" button (Google Identity Services). Google returns an ID token to the
 * callback; the API verifies it and answers with the session cookie.
 */
export function GoogleSignIn({ onSignedIn }: { onSignedIn: (user: MeOut) => void }) {
  const slot = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!CLIENT_ID) {
    return <p role="alert">Máy chủ chưa cấu hình đăng nhập Google (NEXT_PUBLIC_GOOGLE_CLIENT_ID).</p>;
  }

  const handleCredential = async ({ credential }: CredentialResponse) => {
    setPending(true);
    setError(null);
    const { data, error: failure } = await authSignInGoogle({ body: { credential } });
    if (data) {
      onSignedIn(data);
      return;
    }
    setPending(false);
    setError(errorMessage(failure));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        // onReady also runs after client-side navigations, so the button is drawn again.
        onReady={() => {
          const id = window.google?.accounts.id;
          if (!id || !slot.current) return;
          id.initialize({ client_id: CLIENT_ID, callback: (r) => void handleCredential(r) });
          id.renderButton(slot.current, {
            type: "standard",
            theme: "filled_blue",
            size: "large",
            shape: "pill",
            text: "signin_with",
            locale: "vi",
            width: 280,
          });
        }}
      />
      <div ref={slot} className="min-h-11" aria-busy={pending} />
      {pending && <p className="text-sm text-muted-foreground">Đang đăng nhập...</p>}
      {error && (
        <p role="alert" className="max-w-xs text-center text-sm font-semibold text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
