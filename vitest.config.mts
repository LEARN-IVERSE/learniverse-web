import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    // Project convention: flat tests/test_*.ts(x); E2E lives in tests/e2e (Playwright)
    include: ["tests/test_*.{ts,tsx}"],
  },
});
