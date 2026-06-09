import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Per-request Content-Security-Policy with a nonce (Next 16 `proxy` convention,
 * formerly `middleware`). Next reads the CSP from the forwarded *request* header
 * to nonce its own framework scripts, and we also set it on the response so the
 * browser enforces it. `'strict-dynamic'` lets those nonced scripts load their
 * own dependencies (next/script analytics, the Turnstile widget) without
 * enumerating every host.
 *
 * Rollout safety: defaults to **Report-Only** (logs violations, blocks nothing)
 * so a missed directive can't break the live site. Set `CSP_ENFORCE=true` to
 * switch to the enforcing header once the reports look clean. `style-src`
 * allows 'unsafe-inline' because Next/recharts/next-font emit inline styles.
 *
 * The matcher skips API routes, the embeddable /embed widget (it sets its own
 * framing rules and ships inline styles), Next internals and static assets.
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https:`,
    `frame-src https://challenges.cloudflare.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join("; ");

  // Forward the nonce + CSP on the request so Next applies the nonce to its
  // scripts and the layout can read it via headers().
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const headerName =
    process.env.CSP_ENFORCE === "true"
      ? "content-security-policy"
      : "content-security-policy-report-only";
  response.headers.set(headerName, csp);
  return response;
}

export const config = {
  matcher: [
    // All paths except API routes, the embed widget, Next internals, and files
    // with an extension (static assets, sitemap.xml, robots.txt, feed.xml…).
    "/((?!api|embed|_next/static|_next/image|.*\\..*).*)",
  ],
};
