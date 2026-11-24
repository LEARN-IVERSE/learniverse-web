import { createHash, createHmac } from "node:crypto";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { credential?: unknown } | null;
  if (typeof body?.credential !== "string") {
    return Response.json(
      { error: { code: "invalid_credential", message: "Thông tin đăng nhập không hợp lệ." } },
      { status: 422 },
    );
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of ["origin", "sec-fetch-site"]) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }

  // Only the hosting proxy can assert a deployed client's source address.
  const secret = process.env.LOGIN_PROXY_SECRET;
  if (process.env.VERCEL === "1" || secret) {
    const address = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") : null;
    if (!secret || !address) {
      return Response.json(
        {
          error: { code: "login_proxy_unavailable", message: "Máy chủ chưa xác minh được nguồn đăng nhập." },
        },
        { status: 503 },
      );
    }
    const sentAt = String(Math.floor(Date.now() / 1000));
    const digest = createHash("sha256").update(body.credential).digest("hex");
    const signature = createHmac("sha256", secret).update(`${address}\n${sentAt}\n${digest}`).digest("hex");
    headers.set("x-learniverse-client-ip", address);
    headers.set("x-learniverse-signed-at", sentAt);
    headers.set("x-learniverse-signature", signature);
  }

  try {
    const upstream = await fetch(`${API_URL}/v1/auth/google`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "manual",
    });
    const forwarded = new Headers({ "Cache-Control": "no-store" });
    for (const name of ["content-type", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value !== null) forwarded.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) forwarded.append("Set-Cookie", cookie);
    return new Response(upstream.body, { status: upstream.status, headers: forwarded });
  } catch {
    return Response.json(
      { error: { code: "login_api_unavailable", message: "Chưa kết nối được máy chủ. Bạn thử lại nhé." } },
      { status: 502 },
    );
  }
}
