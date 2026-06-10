import type { NextConfig } from "next";

/**
 * Baseline security headers applied to every response. These are cheap,
 * defense-in-depth measures that complement (not replace) the Cloudflare edge
 * protection documented in `deploy/SECURITY.md`.
 *
 * No Content-Security-Policy with `script-src` is set here: the app ships
 * Next.js inline hydration scripts and recharts inline styles, so a strict CSP
 * needs nonces and careful testing. We only enforce `frame-ancestors` for
 * clickjacking protection, which is safe and doesn't touch script/style.
 * HSTS assumes the site is served over HTTPS (Cloudflare terminates TLS).
 */
/** Headers shared by every response (framing aside). */
const baseHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

/** Clickjacking protection for the app itself — must NOT be framed. */
const denyFramingHeaders = [
  ...baseHeaders,
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

/** The /embed widget is meant to be iframed by third-party sites, so it opts
 * out of the deny-framing headers (no X-Frame-Options; CSP allows any ancestor). */
const allowFramingHeaders = [
  ...baseHeaders,
  { key: "Content-Security-Policy", value: "frame-ancestors *" },
];

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (`.next/standalone`) so the Docker
  // runtime image stays small and doesn't need the full node_modules tree.
  output: "standalone",
  async headers() {
    return [
      // Everything except the embed widget gets the strict no-framing headers.
      { source: "/((?!embed).*)", headers: denyFramingHeaders },
      { source: "/embed", headers: allowFramingHeaders },
      { source: "/embed/:path*", headers: allowFramingHeaders },
    ];
  },
};

export default nextConfig;
