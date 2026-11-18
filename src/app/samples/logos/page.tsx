import Link from "next/link";

import { baloo, lexend } from "@/features/samples/d/fonts";
import { LogoCometL1 } from "@/features/samples/logo-comet";
import { LOGO_CONCEPTS, LogoPorthole, Wordmark } from "@/features/samples/logos";

const COMET_NOTES = [
  "Sao chổi vụt qua ô cửa: đuôi bay vào từ ngoài vành phía trên-trái, vẽ thành chữ “L”, mảnh ở đuôi và to dần về phía đầu.",
  "Tới chân chữ L thì vọt xéo lên; đầu sao chổi là số “1” nghiêng về phía trước, đè lên đuôi và thò ra ngoài vành một chút. L1 đọc thành “LI”, viết gọn của LEARNIVERSE.",
  "Phong cách hoạt hình: màu phẳng, đuôi 2 lớp xanh – trắng; viền navy quanh đuôi và số 1 để phần nằm ngoài ô cửa vẫn rõ trên cả nền sáng lẫn nền tối.",
  "Viền ô cửa: vành xanh đậm và một vòng mảnh bên trong; quầng sáng quanh đầu màu xanh nên không bị đục màu.",
  "Toàn bộ là hình vẽ, không dùng font. Sao lấp lánh, sao chổi lướt nhẹ (tự tắt khi bật giảm chuyển động).",
];

const SIZES = [64, 48, 32, 24, 16];

function CometShowcase() {
  return (
    <section
      aria-labelledby="comet-title"
      className="mt-8 overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5"
    >
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="grid place-items-center bg-gradient-to-br from-sky-50 to-blue-100/70 p-10">
          <LogoCometL1 className="size-56" animated />
        </div>
        <div className="grid place-items-center bg-[#0b1f5c] p-10">
          <LogoCometL1 className="size-40" animated />
        </div>
      </div>

      <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
        <div>
          <p className="text-xs font-bold tracking-[.25em] text-blue-600 uppercase">Mẫu 3 · bản chỉnh sửa</p>
          <h2 id="comet-title" className="font-display text-3xl font-extrabold">
            Sao chổi L1
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {COMET_NOTES.map((note) => (
              <li key={note} className="flex gap-2">
                <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
                {note}
              </li>
            ))}
          </ul>
          <Link
            href="/samples/d#logo=comet"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Xem Sao chổi L1 trong mẫu D →
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <LogoCometL1 className="size-12" />
            <Wordmark className="text-[2rem]" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[#0b1f5c] p-4">
            <LogoCometL1 className="size-12" />
            <Wordmark className="text-[2rem]" tone="dark" />
          </div>

          <div className="flex items-end gap-5 rounded-2xl p-4 ring-1 ring-slate-100">
            {SIZES.map((px) => (
              <span key={px} className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground">
                <span className="block" style={{ width: px, height: px }}>
                  <LogoCometL1 className="size-full" />
                </span>
                {px}px
              </span>
            ))}
          </div>

          <div aria-label="Thử trên tab trình duyệt" className="rounded-t-xl bg-slate-200 px-3 pt-2">
            <div className="flex w-fit items-center gap-2 rounded-t-lg bg-white px-3 py-1.5 text-xs text-slate-700">
              <span className="block size-4">
                <LogoCometL1 className="size-full" />
              </span>
              LEARNIVERSE · Học tập
              <span aria-hidden className="ml-3 text-slate-400">
                ×
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 rounded-2xl bg-slate-50 p-4 text-xs text-muted-foreground">
            <span className="flex flex-col items-center gap-1">
              <LogoPorthole className="size-16" />
              Trước
            </span>
            <span aria-hidden className="text-lg text-slate-300">
              →
            </span>
            <span className="flex flex-col items-center gap-1">
              <LogoCometL1 className="size-16" />
              Sau
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Temporary K2 route: compare logo concepts at real sizes before one is chosen.
export default function LogoLab() {
  return (
    <main
      className={`${lexend.variable} ${baloo.variable} logo-lab font-sans mx-auto w-full max-w-6xl p-6 md:p-10`}
    >
      <Link href="/samples" className="text-sm font-medium text-blue-700 hover:underline">
        ← Các mẫu giao diện
      </Link>
      <h1 className="mt-3 font-display text-4xl font-extrabold">Đề xuất logo LEARNIVERSE</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Chủ đề: một vũ trụ chứa chữ cái và con số. Mỗi mẫu được xem ở cỡ lớn, trên nền tối, ghép với chữ
        LEARNIVERSE và thu nhỏ tới 16px (icon trên tab trình duyệt). Bấm “Xem trong mẫu D” để thấy logo nằm
        trong giao diện thật.
      </p>

      <CometShowcase />

      <h2 className="mt-14 font-display text-2xl font-bold text-slate-500">Các mẫu ban đầu</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {LOGO_CONCEPTS.map(({ id, name, meaning, Logo }, i) => (
          <article
            key={id}
            className="overflow-hidden rounded-[2rem] bg-white ring-1 ring-black/5"
            aria-label={`Mẫu logo ${name}`}
          >
            <div className="grid grid-cols-2">
              <div className="grid place-items-center bg-sky-50 p-6">
                <Logo className="size-32" animated />
              </div>
              <div className="grid place-items-center bg-[#0b1f5c] p-6">
                <Logo className="size-24" animated />
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs font-bold tracking-[.25em] text-blue-600 uppercase">Mẫu {i + 1}</p>
                <h2 className="font-display text-2xl font-bold">{name}</h2>
                <p className="mt-1 text-sm text-slate-600">{meaning}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <Logo className="size-11" />
                <Wordmark className="text-3xl" />
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#0b1f5c] p-4">
                <Logo className="size-11" />
                <Wordmark className="text-3xl" tone="dark" />
              </div>
              <div className="flex items-end gap-5 text-[11px] text-muted-foreground">
                {[64, 32, 16].map((px) => (
                  <span key={px} className="flex flex-col items-center gap-1">
                    <span className="block shrink-0" style={{ width: px, height: px }}>
                      <Logo className="size-full" />
                    </span>
                    <span>{px === 16 ? "16px · favicon" : `${px}px`}</span>
                  </span>
                ))}
              </div>
              <Link
                href={`/samples/d#logo=${id}`}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Xem trong mẫu D →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
