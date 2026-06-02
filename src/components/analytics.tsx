import Script from "next/script";

/**
 * Plausible Analytics — cookieless, privacy-friendly reach measurement. It
 * stores no cookies and collects no personal data, so it needs no consent gate
 * (see CookieBanner, which is informational only).
 *
 * Configured via env, so it stays off in dev/preview unless explicitly set:
 *   NEXT_PUBLIC_PLAUSIBLE_DOMAIN — the data-domain registered in Plausible
 *     (e.g. "wahlumfragen.example"). Required to render the script.
 *   NEXT_PUBLIC_PLAUSIBLE_SRC — script URL. Defaults to plausible.io's hosted
 *     script; override for a self-hosted instance
 *     (e.g. "https://stats.example/js/script.js").
 *
 * Both are NEXT_PUBLIC_* because the script runs in the browser.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  const src =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

  return (
    <Script
      data-domain={domain}
      src={src}
      strategy="lazyOnload"
      defer
    />
  );
}
