import type { MetadataRoute } from "next";
import { loadBundestagData, loadParliamentData } from "@/lib/data";
import { PARTIES } from "@/lib/parties";
import { STATE_PARLIAMENTS } from "@/lib/parliaments";
import { absoluteUrl } from "@/lib/seo";

/**
 * Sitemap covering the static sections plus every institute and survey detail
 * page. Data comes from the cached loader, so generating it is cheap and the
 * sitemap regenerates with the rest on ingest revalidation. Well under the
 * 50k-URL limit (a few thousand surveys).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ bundestag, lastUpdate }, ...landtagResults] = await Promise.all([
    loadBundestagData(),
    ...STATE_PARLIAMENTS.map((p) => loadParliamentData(p.id)),
  ]);
  const now = lastUpdate ? new Date(lastUpdate) : undefined;

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/trend"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/archiv"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/koalition"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    { url: absoluteUrl("/wahlen"), changeFrequency: "yearly", priority: 0.6 },
    {
      url: absoluteUrl("/laender"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/partei"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/datenstand"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.4,
    },
    ...PARTIES.map((p) => ({
      url: absoluteUrl(`/partei/${p.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...STATE_PARLIAMENTS.map((p) => ({
      url: absoluteUrl(`/laender/${p.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    // Impressum and Datenschutz are intentionally omitted: they carry a
    // `noindex` robots tag (see buildMetadata) and must not be advertised for
    // indexing.
  ];

  // Institute pages: distinct institutes, stamped with their newest survey.
  const instituteNewest = new Map<string, string>();
  for (const s of bundestag) {
    const prev = instituteNewest.get(s.institute.id);
    if (!prev || s.date > prev) instituteNewest.set(s.institute.id, s.date);
  }
  const instituteEntries: MetadataRoute.Sitemap = [...instituteNewest].map(
    ([id, date]) => ({
      url: absoluteUrl(`/institut/${id}`),
      lastModified: new Date(date),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  const surveyEntries: MetadataRoute.Sitemap = bundestag.map((s) => ({
    url: absoluteUrl(`/archiv/${s.id}`),
    lastModified: new Date(s.date),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const landtagSurveyEntries: MetadataRoute.Sitemap = landtagResults
    .flatMap((r) => r.surveys)
    .map((s) => ({
      url: absoluteUrl(`/archiv/${s.id}`),
      lastModified: new Date(s.date),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }));

  return [
    ...staticEntries,
    ...instituteEntries,
    ...surveyEntries,
    ...landtagSurveyEntries,
  ];
}
