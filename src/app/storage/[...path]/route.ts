// Same-origin window onto the object storage, for when the app is shared on the internet and browsers
// cannot reach localhost:8333. It is not an open proxy:
//  - only GET / HEAD, and only inside <bucket>/uploads/;
//  - the storage still checks the presigned signature, which covers the internal host and path, so the
//    request is sent to the storage's own address (a plain Next.js rewrite would keep the public Host
//    header and the signature would no longer match).
const STORAGE_URL = process.env.STORAGE_URL ?? "http://localhost:8333";
const BUCKET = process.env.S3_BUCKET ?? "learniverse";

const FORWARD_REQUEST = ["range", "if-none-match", "if-match"];
const FORWARD_RESPONSE = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
  "cache-control",
];

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  if (path[0] !== BUCKET || path[1] !== "uploads") return new Response("Not found", { status: 404 });

  const target = `${STORAGE_URL}/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
  const headers = new Headers();
  for (const name of FORWARD_REQUEST) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    redirect: "manual",
  });

  const out = new Headers();
  for (const name of FORWARD_RESPONSE) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: out,
  });
}

export { proxy as GET, proxy as HEAD };
