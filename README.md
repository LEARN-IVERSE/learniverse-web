# learniverse-web

Frontend của LEARNIVERSE: Next.js 16 (App Router) + TypeScript + Tailwind CSS, quản lý bằng pnpm.
Kế hoạch & kiến trúc: `claude-khkt/plan.md`, `claude-khkt/architecture/` (LikeC4).

## Chạy trên máy dev

```bash
cp .env.example .env.local
pnpm install
pnpm gen:api        # sinh client từ OpenAPI của ../learniverse-api (không sửa tay src/lib/api)
pnpm dev            # http://localhost:3000 ; /api/* được proxy sang API_URL
```

## Kiểm tra

```bash
pnpm lint && pnpm typecheck && pnpm test     # ESLint + Prettier, tsc, Vitest
pnpm test:e2e                                # Playwright (desktop + mobile)
pnpm vitest run tests/test_api_status.tsx    # chạy 1 file test
```

Test đặt ở `tests/test_*.ts(x)` (Vitest) và `tests/e2e/test_*.ts` (Playwright).
Thư mục `scripts/` chỉ chứa việc vận hành (sinh API client), không chứa test.
