// @vitest-environment node
import { createHash, createHmac } from "node:crypto";

import { afterEach, expect, it, vi } from "vitest";

import { POST } from "@/app/api/v1/auth/google/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function login(headers: Record<string, string>) {
  return POST(
    new Request("https://web.example.org/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: "fixture-credential" }),
      headers,
    }),
  );
}

it("forwards the trusted address, binds the signature to the credential, and preserves retry time", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("LOGIN_PROXY_SECRET", "fixture-signing-secret");
  const request = vi.fn<(input: string, init: RequestInit) => Promise<Response>>(async () =>
    Response.json(
      { error: { code: "request_rate_limited" } },
      { status: 429, headers: { "Retry-After": "42" } },
    ),
  );
  vi.stubGlobal("fetch", request);
  const response = await login({
    Origin: "https://web.example.org",
    "Sec-Fetch-Site": "same-origin",
    "X-Vercel-Forwarded-For": "192.0.2.10",
    "X-Learniverse-Client-Ip": "192.0.2.99",
  });
  expect(response.status).toBe(429);
  expect(response.headers.get("Retry-After")).toBe("42");

  const [[, init]] = request.mock.calls;
  const headers = new Headers(init.headers);
  const timestamp = headers.get("X-Learniverse-Signed-At");
  const digest = createHash("sha256").update("fixture-credential").digest("hex");
  const expected = createHmac("sha256", "fixture-signing-secret")
    .update(`192.0.2.10\n${timestamp}\n${digest}`)
    .digest("hex");
  expect(headers.get("X-Learniverse-Client-Ip")).toBe("192.0.2.10");
  expect(headers.get("X-Learniverse-Signature")).toBe(expected);
  expect(headers.get("Origin")).toBe("https://web.example.org");
  expect(headers.get("Sec-Fetch-Site")).toBe("same-origin");
});

it("rejects a deployed login without the proxy address", async () => {
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv("LOGIN_PROXY_SECRET", "fixture-signing-secret");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const response = await login({ "X-Forwarded-For": "192.0.2.99" });
  expect(response.status).toBe(503);
  expect(fetchMock).not.toHaveBeenCalled();
});
