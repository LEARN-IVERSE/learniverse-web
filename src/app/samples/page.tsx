import Link from "next/link";

const SAMPLES = [
  {
    href: "/samples/a",
    name: "A · Classic Dashboard",
    font: "Be Vietnam Pro",
    points: [
      "Sidebar chuẩn của shadcn, thu gọn còn icon",
      "Header có ô tìm kiếm, gọn gàng, quen thuộc",
      "Điện thoại: sidebar trượt ra từ trái",
    ],
  },
  {
    href: "/samples/b",
    name: "B · Playful Learning",
    font: "Nunito",
    points: [
      "Nút điều hướng lớn, bo tròn, nhiều màu",
      "Thẻ môn học nổi bật, hợp học sinh THCS",
      "Điện thoại: thanh tab ở dưới đáy",
    ],
  },
  {
    href: "/samples/c",
    name: "C · Minimal Focus",
    font: "Lexend",
    points: [
      "Thanh icon hẹp, nhiều khoảng trắng",
      "Chữ dễ đọc, tập trung vào nội dung bài",
      "Điện thoại: menu mở bằng nút ☰",
    ],
  },
];

export default function SamplesIndex() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6 md:p-10">
      <h1 className="text-3xl font-bold text-blue-700">LEARNIVERSE · Giao diện mẫu (K2)</h1>
      <p className="mt-2 text-muted-foreground">
        Các mẫu dùng shadcn/ui + Tailwind, cùng dữ liệu minh họa và đủ khung: Header, Sidebar (Học tập · Mạng
        xã hội · Bảng xếp hạng), vùng nội dung, nút AI góc phải, Footer. Thu nhỏ cửa sổ để xem bản điện thoại.
      </p>
      <Link
        href="/samples/d"
        className="mt-8 block rounded-3xl bg-blue-600 p-6 text-white transition hover:bg-blue-700 md:p-8"
      >
        <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">MỚI</span>
        <p className="mt-3 text-2xl font-bold">D · Quỹ đạo: bố cục của C, màu của B, nhiều chi tiết hơn</p>
        <ul className="mt-3 grid gap-1 text-sm text-blue-100 md:grid-cols-2">
          <li>• Mỗi môn là một “hành tinh” có ảnh cover và hoa văn nền riêng</li>
          <li>• Văn mang màu tranh Đông Hồ, hoa sen, câu Kiều; Toán có parabol, công thức</li>
          <li>• Mạng xã hội có bong bóng chat bay; Bảng xếp hạng có huy chương lớn, bục 1-2-3</li>
          <li>• Linh vật trợ lý AI “Sao Nhí”, hiệu ứng tự tắt khi bật giảm chuyển động</li>
        </ul>
        <p className="mt-4 font-semibold">Xem mẫu D →</p>
      </Link>
      <Link
        href="/samples/logos"
        className="mt-4 flex items-center justify-between gap-4 rounded-3xl border-2 border-dashed border-blue-300 p-5 transition hover:border-blue-500 hover:bg-blue-50"
      >
        <span>
          <span className="block text-lg font-bold">Đề xuất logo: vũ trụ của chữ cái và con số</span>
          <span className="text-sm text-muted-foreground">
            5 mẫu, xem ở nhiều kích cỡ, nền sáng/tối, ghép chữ
          </span>
        </span>
        <span className="shrink-0 font-semibold text-blue-700">Xem logo →</span>
      </Link>
      <p className="mt-10 text-sm font-semibold text-muted-foreground">Các mẫu trước</p>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        {SAMPLES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
          >
            <p className="text-lg font-bold">{s.name}</p>
            <p className="text-sm text-muted-foreground">Font: {s.font}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
              {s.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-4 font-semibold text-blue-700">Xem mẫu →</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
