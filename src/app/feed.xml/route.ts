import { loadBundestagData } from "@/lib/data";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

/**
 * RSS 2.0 feed of the most recent Bundestag surveys, so readers and aggregators
 * can subscribe to new polls. Reads the cached loader (no per-request DB hit)
 * and is edge-cacheable. dawum data is ODbL — attribution is included.
 */

/** How many newest surveys to include — enough to be useful, small to serialize. */
const FEED_LIMIT = 50;

/** Top parties summarised in each item's description. */
const SUMMARY_PARTIES = 6;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const items = bundestag.slice(0, FEED_LIMIT);

  const lastBuild = (lastUpdate ? new Date(lastUpdate) : new Date(0)).toUTCString();
  const selfUrl = absoluteUrl("/feed.xml");

  const itemXml = items
    .map((s) => {
      const summary = s.results
        .slice(0, SUMMARY_PARTIES)
        .map((r) => `${r.shortcut} ${r.percent.toFixed(1).replace(".", ",")} %`)
        .join(" · ");
      const url = absoluteUrl(`/archiv/${s.id}`);
      const title = `${s.institute.name} – ${s.date}`;
      const pubDate = new Date(s.date).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(summary)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(`${SITE_NAME} – Neue Umfragen`)}</title>`,
    `    <link>${escapeXml(absoluteUrl("/"))}</link>`,
    `    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />`,
    "    <description>Aktuelle Umfragen zur Sonntagsfrage für die Bundestagswahl, aggregiert aus dawum.de (ODbL).</description>",
    "    <language>de-DE</language>",
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    "    <copyright>Datenquelle: dawum.de, ODbL-1.0</copyright>",
    itemXml,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=600, stale-while-revalidate=300",
    },
  });
}
