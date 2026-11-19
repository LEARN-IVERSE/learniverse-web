import { CometLogo } from "@/components/brand/comet-logo";
import { Wordmark } from "@/components/brand/wordmark";

// Policy pages come later; the labels follow the product spec.
const FOOTER_LINKS = ["Giới thiệu", "Liên hệ", "Điều khoản", "Chính sách bảo mật"];

export function AppFooter() {
  return (
    // Right padding keeps the text clear of the floating AI button (64px + its margin).
    <footer className="border-t border-blue-100 py-6 pr-24 pb-28 pl-4 text-sm text-slate-500 md:pr-28 md:pb-6 md:pl-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2">
        <span className="inline-flex items-center gap-2">
          <CometLogo className="size-7" />
          <Wordmark className="text-lg" />
        </span>
        {FOOTER_LINKS.map((label) => (
          <span key={label}>{label}</span>
        ))}
        <span className="ml-auto text-xs tracking-widest uppercase">Our universe of learning</span>
      </div>
    </footer>
  );
}
