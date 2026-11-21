"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { CometLogo } from "@/components/brand/comet-logo";
import { Mascot } from "@/components/brand/mascot";
import { Wordmark } from "@/components/brand/wordmark";
import type { MeOut } from "@/lib/api-client";

import { GoogleSignIn } from "./google-sign-in";
import { safeNextPath } from "./safe-next";
import { useSession } from "./session";

/** Public sign-in page: the only learner page that does not need an account (K3-D2). */
export function SignInScreen() {
  const router = useRouter();
  const session = useSession();
  const goNext = useCallback(() => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(safeNextPath(next));
  }, [router]);

  const status = session?.state.status;
  const settleSignOut = session?.settleSignOut;

  // Already signed in (for example a bookmarked /login): skip straight to the app. The session is the one
  // shared with the learner pages, so there is no second /me call to disagree with it.
  useEffect(() => {
    if (status === "signed-in") goNext();
  }, [status, goNext]);

  // Just signed out: from here on the visitor is a plain guest.
  useEffect(() => {
    if (status === "signing-out") settleSignOut?.();
  }, [status, settleSignOut]);

  const onSignedIn = (user: MeOut) => {
    session?.signIn(user); // the effect above then leaves for the page they asked for
  };

  return (
    <section
      aria-labelledby="sign-in-title"
      className="relative w-full max-w-md rounded-[2.5rem] bg-white/90 px-6 py-10 text-center shadow-[0_30px_80px_-40px_rgba(37,99,235,.6)] ring-1 ring-blue-100 sm:px-10"
    >
      <Mascot className="d-bob absolute -top-8 -right-4 size-20" />
      <CometLogo className="mx-auto size-24" animated />
      <h1 id="sign-in-title" className="mt-4">
        <Wordmark className="text-4xl" />
      </h1>
      <p className="mt-1 text-xs font-semibold tracking-[.3em] text-slate-500 uppercase">
        Our universe of learning
      </p>
      <p className="mx-auto mt-6 max-w-xs text-slate-700">
        Đăng nhập bằng tài khoản Google để bắt đầu hành trình học Toán, Tiếng Anh và Ngữ văn lớp 9.
      </p>
      <div className="mt-6">
        <GoogleSignIn onSignedIn={onSignedIn} />
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        LEARNIVERSE chỉ nhận tên và email từ Google, không bao giờ thấy mật khẩu của bạn.
      </p>
    </section>
  );
}
