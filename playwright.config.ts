import { defineConfig, devices } from "@playwright/test";

const PORT = 3100; // `next dev`, used by every test file
const PROD_PORT = 3200; // `next build` + `next start`: the build that gets shared (see test_auth_prod.ts)
// Google's script is stubbed in E2E, so any client ID works; keeps CI independent of .env.local.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "e2e-client-id";

export default defineConfig({
  // Project convention: tests/e2e/test_*.ts
  testDir: "tests/e2e",
  testMatch: "test_*.ts",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "desktop", testIgnore: "**/test_*_prod.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testIgnore: "**/test_*_prod.ts", use: { ...devices["Pixel 7"] } },
    // Behaviour that only shows in the production build (client-side navigation caching, cache components).
    {
      name: "production",
      testMatch: "test_*_prod.ts",
      use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${PROD_PORT}` },
    },
    {
      name: "production-mobile",
      testMatch: "test_*_prod.ts",
      // iPhone-sized screen and touch; WebKit itself is not installed here, so it runs on Chromium.
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        baseURL: `http://localhost:${PROD_PORT}`,
      },
    },
  ],
  webServer: [
    {
      command: `pnpm dev --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: CLIENT_ID },
    },
    {
      command: `pnpm build && pnpm start --port ${PROD_PORT}`,
      url: `http://localhost:${PROD_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: CLIENT_ID },
    },
  ],
});
