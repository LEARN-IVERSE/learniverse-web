// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET, PUT } from "@/app/storage/[...path]/route";

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) });

afterEach(() => vi.unstubAllGlobals());

describe("storage proxy", () => {
  it("only serves the uploads folder of the bucket", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const path of [
      ["learniverse"],
      ["learniverse", "private", "x"],
      ["other-bucket", "uploads", "x"],
      [],
    ]) {
      const res = await GET(new Request("https://demo.test/storage/x"), ctx(...path));
      expect(res.status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards a signed read to the storage's own address, keeping the query exactly", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("bytes", { status: 200, headers: { "content-type": "image/png", "set-cookie": "x=1" } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const url = "https://demo.test/storage/learniverse/uploads/u1/f1?X-Amz-Signature=abc&X-Amz-Expires=900";
    const res = await GET(new Request(url), ctx("learniverse", "uploads", "u1", "f1"));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [target, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(target).toBe(
      "http://localhost:8333/learniverse/uploads/u1/f1?X-Amz-Signature=abc&X-Amz-Expires=900",
    );
    expect(init.method).toBe("GET");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("set-cookie")).toBeNull(); // upstream headers are filtered
    expect(await res.text()).toBe("bytes");
  });

  it("streams an upload with its content type and does not forward the browser's host or cookies", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const req = new Request("https://demo.test/storage/learniverse/uploads/u1/f1?X-Amz-Signature=abc", {
      method: "PUT",
      headers: { "content-type": "image/png", cookie: "lv_session=secret", host: "demo.test" },
      body: "png-bytes",
    });
    const res = await PUT(req, ctx("learniverse", "uploads", "u1", "f1"));
    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { duplex?: string }];
    const sent = new Headers(init.headers);
    expect(sent.get("content-type")).toBe("image/png");
    expect(sent.get("cookie")).toBeNull();
    expect(sent.get("host")).toBeNull();
    expect(init.duplex).toBe("half");
    expect(init.body).not.toBeUndefined();
  });
});
