# LEARNIVERSE - WEB

**Frontend** của LEARNIVERSE - Nền tảng học tập kết hợp mạng xã hội giáo dục cho học sinh lớp 9.

**Website:** https://learniverse.io.vn  
**Ngôn ngữ lập trình:** TypeScript, CSS

---

## Tổng quan

Repo này chứa toàn bộ giao diện người dùng của LEARNIVERSE, bao gồm:

- Trang học tập (3 môn: Toán, Tiếng Anh, Ngữ văn)
- Trang Mạng xã hội (đăng bài, bình luận)
- Trang Bảng xếp hạng (sao, đóng góp, thời gian)
- Trang Admin (quản lý tài khoản, nội dung, cộng đồng, AI)
- Trợ lý AI Sao Nhí (chat, hỏi đáp, nhận ảnh)

---

## Cách triển khai ở máy local

### Yêu cầu

- **Node.js** ≥ 22
- **pnpm** (bật bằng `corepack enable`)
- **learniverse-api** đang chạy ở `http://localhost:8000` (xem README của repo **learniverse-api**)

### Bước 1: Cài đặt

```bash
cp .env.example .env.local
pnpm install
```

### Bước 2: Sinh API client

```bash
pnpm gen:api
```

Lệnh này lấy file OpenAPI từ `../learniverse-api/openapi.json` và sinh TypeScript client vào `src/lib/api/`. **KHÔNG BAO GIỜ sửa tay** các file trong `src/lib/api/client/` và `src/lib/api/core/`.

### Bước 3: Chạy dev server

```bash
pnpm dev
```

Mở http://localhost:3000. Các request tới `/api/*` được tự động proxy sang `http://localhost:8000` (xem `next.config.ts`).

---

## Kiểm tra

### Lint + Format + Type check

```bash
pnpm lint           # ESLint + Prettier
pnpm typecheck      # TypeScript (tsc --noEmit)
```

### Test

```bash
pnpm test           # Vitest (unit tests)
pnpm test:e2e       # Playwright (E2E tests, desktop + mobile)

# Chạy 1 file test
pnpm vitest run tests/test_lesson_row.tsx
pnpm playwright test tests/e2e/test_login.ts
```

Ca liên thông K12 dùng riêng PostgreSQL và kho tệp thử cục bộ. Từ repo API, chạy:

```bash
uv run python -m tests.k12_linked_server /tmp/k12-answers.json
```

Từ repo web, khi API thử đã sẵn sàng:

```bash
API_URL=http://127.0.0.1:8420 K12_TEST_ANSWER_FILE=/tmp/k12-answers.json pnpm test:e2e tests/e2e/test_k12_linked.ts
```

Ca thử dùng trình xác minh Google giả và chỉ khởi động API trên địa chỉ loopback.

### Toàn bộ kiểm tra (CI-ready)

```bash
pnpm lint && pnpm typecheck && pnpm test
```

---

## Chức năng chính

### Học tập (`/courses`)

- Chọn môn → xem danh sách bài học theo chương
- Mỗi bài có 4 hoạt động: **Lý thuyết, Bài tập, Dạy AI, Ôn tập**
- Hiển thị công thức Toán bằng **KaTeX**
- Hệ thống sao: 0–4 sao/bài, đủ 4 sao = Hoàn thành
- Chuỗi ngày học hiển thị trên header
- Ôn tập/Kiểm tra định kỳ có đồng hồ đếm ngược

### Mạng xã hội (`/community`)

- Đăng bài hỏi đáp, chia sẻ kiến thức
- Đính kèm ảnh (tối đa 5 ảnh/bài)
- Bình luận, thích bài viết
- Báo cáo nội dung vi phạm
- Lọc theo môn học, sắp xếp theo mới/hot

### Bảng xếp hạng (`/leaderboard`)

- TOP 10 Sao (nhiều sao nhất)
- TOP 10 Đóng góp (điểm từ hoạt động cộng đồng)
- TOP 10 Thời gian (thời gian học)
- Hiển thị vị trí của người dùng hiện tại

### Trợ lý AI Sao Nhí

- Nút nổi ở góc dưới bên phải mọi trang
- Chat với AI về bài học
- Gửi ảnh bài tập để hỗ trợ giải
- Lịch sử trò chuyện
- Giới hạn 30 câu hỏi/ngày, 5 ảnh/ngày

### Admin (`/admin`)

- **Tài khoản:** Quản lý user, vai trò, quyền, khóa/mở khóa
- **Nội dung:** Soạn bài, câu hỏi, gửi duyệt, duyệt yêu cầu thay đổi
- **Cộng đồng:** Kiểm duyệt bài đăng, bình luận, xử lý báo cáo
- **Chấm tự luận:** Giáo viên chấm bài tự luận
- **Cấu hình AI:** Bật/tắt AI, đổi model, xem chi phí
- **Nhật ký:** Audit log mọi thao tác quản trị

---

## Công nghệ

| Thành phần          | Công nghệ                                          |
| ------------------- | -------------------------------------------------- |
| **Framework**       | Next.js 16.4 (App Router, React Server Components) |
| **UI Library**      | React 19.3                                         |
| **Language**        | TypeScript (strict mode)                           |
| **Styling**         | Tailwind CSS 4.3 + custom design system            |
| **Icons**           | Lucide React                                       |
| **Math rendering**  | KaTeX                                              |
| **Markdown**        | react-markdown + remark-math + rehype-katex        |
| **API client**      | Auto-generated từ OpenAPI (@hey-api/openapi-ts)    |
| **Testing**         | Vitest (unit) + Playwright (E2E)                   |
| **Linting**         | ESLint (eslint-config-next) + Prettier             |
| **Package manager** | pnpm 12.21                                         |
| **Observability**   | OpenTelemetry (@vercel/otel)                       |

---

<p align="center">
  <strong>🌟 OUR UNIVERSE OF LEARNING 🌟</strong>
</p>
