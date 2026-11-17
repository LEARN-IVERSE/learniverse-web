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
  },
});
