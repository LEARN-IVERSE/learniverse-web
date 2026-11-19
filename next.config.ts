import type { NextConfig } from "next";

// learniverse-api base URL (server-side only, never exposed to the browser)
const API_URL = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // No floating dev badge: it would end up in the visual-regression screenshots (K2).
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Proxy: the browser calls same-origin /api/* and Next.js forwards it to the API,
  // so the API session cookie is first-party (decision D2 in plan.md).
  // Learners land on the learning area; "/" may become a landing page for guests later (K3).
  async redirects() {
    return [{ source: "/", destination: "/hoc-tap", permanent: false }];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
