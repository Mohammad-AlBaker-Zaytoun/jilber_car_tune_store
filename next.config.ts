import type { NextConfig } from "next";
import path from "path";

// Baseline HTTP security headers applied to every response. HSTS is included but
// only takes effect over HTTPS (the reverse proxy terminates TLS in production).
// CSP is intentionally permissive on script-src to allow Next's inline runtime and
// the inline JSON-LD <script> blocks; tighten with a nonce later if needed.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Prisma's engine is a native binary — keep it external so the server bundle
  // loads it at runtime instead of trying to bundle it.
  serverExternalPackages: ["@prisma/client", "prisma"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
