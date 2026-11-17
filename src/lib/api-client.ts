import { client } from "@/lib/api/client.gen";

// The browser always reaches the API through the same-origin /api/* proxy (see next.config.ts).
// Use an absolute URL because `new Request()` rejects relative URLs outside the browser.
const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
client.setConfig({ baseUrl: `${origin}/api` });

export * from "@/lib/api";
