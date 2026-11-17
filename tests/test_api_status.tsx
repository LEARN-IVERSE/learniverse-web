import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiStatus } from "@/features/system/api-status";

function mockFetch(routes: Record<string, { status: number; body: unknown }>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: Request | string) => {
      const url = typeof input === "string" ? input : input.url;
      const path = Object.keys(routes).find((p) => url.endsWith(p));
      const r = path ? routes[path] : { status: 404, body: {} };
      return new Response(JSON.stringify(r.body), {
        status: r.status,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

describe("ApiStatus", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows OK when both API and DB return 200 through /api", async () => {
    mockFetch({
      "/api/health": { status: 200, body: { status: "ok", service: "learniverse-api", env: "local" } },
      "/api/health/db": { status: 200, body: { status: "ok", database: "PostgreSQL 18.7" } },
    });
    render(<ApiStatus />);
    await waitFor(() => expect(screen.getByText(/PostgreSQL 18.7/)).toBeTruthy());
    expect(screen.getByText(/learniverse-api \(local\)/)).toBeTruthy();
  });

  it("reports a DB error when /api/health/db returns 503", async () => {
    mockFetch({
      "/api/health": { status: 200, body: { status: "ok", service: "learniverse-api", env: "local" } },
      "/api/health/db": { status: 503, body: { error: { code: "db_unavailable", message: "x" } } },
    });
    render(<ApiStatus />);
    await waitFor(() => expect(screen.getByText(/Không kết nối được cơ sở dữ liệu/)).toBeTruthy());
  });
});
