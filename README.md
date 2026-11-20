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

## Share it on the internet (ngrok)

Lets a few people try the app that runs on your machine. See "Chia sẻ thử nghiệm qua ngrok" in `plan.md`.

```bash
# stop `pnpm dev` and the API dev server first, keep `docker compose up -d` running in learniverse-api
./scripts/share-public.sh      # prints the public address; Ctrl-C stops everything
```

Before the first sign-in, add the printed address to **Authorized JavaScript origins** of the Google OAuth
client. Set your own `S3_ACCESS_KEY` / `S3_SECRET_KEY` in `learniverse-api/.env` (docker compose and the API both
read them), and keep `ADMIN_EMAILS` limited to people you trust.
