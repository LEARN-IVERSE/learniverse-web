import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  // Project convention: tests/e2e/test_*.ts
  testDir: "tests/e2e",
  testMatch: "test_*.ts",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Google's script is stubbed in E2E, so any client ID works; keeps CI independent of .env.local.
    env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "e2e-client-id" },
  },
});
