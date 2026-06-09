import type { MetadataRoute } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/**
 * Web App Manifest so the site is installable (Add to Home Screen / desktop
 * PWA). Next serves this at /manifest.webmanifest and links it automatically.
 * Colours mirror the brand (navy header band, parchment background). Uses the
 * existing SVG icon — no offline service worker is registered (the data is
 * DB-driven and changes hourly, so an offline cache would mostly show staleness;
 * that can be added later if needed).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} – Sonntagsfrage & Wahltrend`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    lang: "de",
    background_color: "#f2f1ec",
    theme_color: "#15264c",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
