import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

/** See the CSP note on `upgrade-insecure-requests` below. */
const allowPlaintextHttp = process.env.ALLOW_PLAINTEXT_HTTP === "1";
if (allowPlaintextHttp && !isDev) {
  // Loud on purpose: this weakens a production build if it is ever set by
  // accident, and a silent downgrade of a security header is the worst kind.
  console.warn(
    "\n  !! ALLOW_PLAINTEXT_HTTP=1 — building WITHOUT upgrade-insecure-requests.\n" +
      "     This build is only safe to serve over plain HTTP (tests/staging).\n" +
      "     Do NOT deploy it to production.\n"
  );
}

/**
 * Content-Security-Policy.
 *
 * WHY NO NONCES. Next's nonce approach requires the page to be dynamically
 * rendered on every request (the nonce must be fresh per response), which would
 * disable static rendering and ISR across the whole site. On a single VPS with a
 * single MSSQL box that trade is not worth it — see docs/TASKS_3.md.
 *
 * What we get without nonces is still most of the value: no external script,
 * frame, object or connect origins, no <base> injection, no form hijacking, and
 * no framing at all. What we give up is protection against an *inline* script
 * injection — which requires an HTML-injection bug first, and the app has no raw
 * HTML sink: React escapes everything, and the only dangerouslySetInnerHTML
 * usages are JSON-LD passed through safeJsonLd() (lib/seo/helpers.ts:15).
 *
 * 'unsafe-inline' on style-src is unavoidable regardless of nonces: the design
 * uses inline `style={{...}}` for per-product gradients throughout.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is required in dev only — React uses eval to rebuild server
  // stack traces in the browser. Never enabled in production.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: covers the admin image-upload preview (URL.createObjectURL).
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // The browser only ever calls our own API. Resend and Whish are contacted
  // server-side; the Whish hosted page is a top-level navigation, not a fetch.
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  // Safari honours `upgrade-insecure-requests` even when the page itself was
  // served over plain http (Chrome exempts localhost). On a plaintext build every
  // asset URL is rewritten to https://, nothing connects, and the app renders a
  // blank page in Safari while looking perfectly fine in Chrome — a failure mode
  // that is very easy to ship unnoticed.
  //
  // Production terminates TLS at nginx, so the directive belongs there. Set
  // ALLOW_PLAINTEXT_HTTP=1 only for a build that will be served over plain HTTP:
  // the Playwright suite (see scripts/build-e2e.mjs) or a staging box without a
  // certificate. NEVER set it for the production build.
  ...(isDev || allowPlaintextHttp ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Baseline HTTP security headers applied to every response. HSTS is included but
// only takes effect over HTTPS (the reverse proxy terminates TLS in production).
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // DENY rather than SAMEORIGIN to match `frame-ancestors 'none'` — the app
  // never frames itself, and this is the legacy fallback for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework.
  poweredByHeader: false,

  turbopack: {
    root: path.resolve(__dirname),
  },
  // Prisma's engine is a native binary — keep it external so the server bundle
  // loads it at runtime instead of trying to bundle it.
  // Prisma and the mssql driver load native/dynamic code at runtime — keep them
  // out of the server bundle. `@prisma/adapter-mssql` and `mssql` were added
  // for Prisma 7, which requires a driver adapter instead of a built-in engine.
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "@prisma/adapter-mssql",
    "mssql",
  ],

  images: {
    // All product images are same-origin today (uploads are written to
    // UPLOAD_DIR and served by nginx under UPLOAD_PUBLIC_PATH). No remotePatterns
    // are configured deliberately: an admin pasting an external image URL should
    // fail loudly at build/render rather than silently proxying arbitrary remote
    // content through the optimizer. Add explicit hosts here if that changes.
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
    // Product cards, detail hero, cart thumbnails, admin table thumbs.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [40, 64, 96, 128, 256, 384],
    // Optimised images are content-addressed; cache them hard.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // The sharp/libvips advisories were SVG-parsing related; the upload
    // allowlist already excludes SVG, and this blocks it at the optimizer too.
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Frame sequences and uploaded product images are immutable in practice.
      // nginx sets this in production (deploy/nginx.conf); this covers `next
      // start` without a proxy and keeps the two in sync.
      {
        source:
          "/:dir(scroll-frames|store-hero-frames|pro-tuning-transition-frames-webp)/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
