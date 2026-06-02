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
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
