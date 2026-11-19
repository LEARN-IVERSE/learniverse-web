import type { Metadata } from "next";

import { SpaceBackdrop } from "@/components/layout/space-backdrop";
import { SignInScreen } from "@/features/auth/sign-in-screen";
import { baloo, lexend } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function SignInPage() {
  return (
    <main
      className={cn(
        lexend.variable,
        baloo.variable,
        "app-shell relative isolate grid min-h-svh place-items-center bg-background px-4 py-16 font-sans text-slate-900",
      )}
    >
      <SpaceBackdrop />
      <SignInScreen />
    </main>
  );
}
