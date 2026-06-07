import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * Allow crawling of all content; keep the API routes out of the index (they're
 * data endpoints, linked from the archive, not pages). Points crawlers at the
 * sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/surveys"],
      disallow: "/api/revalidate",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
