import Script from "next/script";

/**
 * countless — our own cookieless, self-hosted analytics. Loads the beacon from
 * our countless instance: no third party, no cookies, no personal data, so it
 * needs no consent gate and no cookie banner.
 *
 * Configured via env, so it stays off in dev/preview unless explicitly set:
 *   NEXT_PUBLIC_COUNTLESS_SITE — the site id registered in countless
 *     (its `sites.id`, e.g. "wahlumfragen.de"). Required to render the script.
 *   NEXT_PUBLIC_COUNTLESS_SRC — the beacon URL of the countless instance
 *     (e.g. "https://stats.example/script.js"). Required to render the script.
 *
 * Both are NEXT_PUBLIC_* because the script runs in the browser.
 */
export function Analytics() {
  const site = process.env.NEXT_PUBLIC_COUNTLESS_SITE;
  const src = process.env.NEXT_PUBLIC_COUNTLESS_SRC;
  if (!site || !src) return null;

  return (
    <Script data-site={site} src={src} strategy="afterInteractive" defer />
  );
}
