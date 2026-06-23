import type { Metadata } from "next";
import Link from "next/link";
import { ContributingSurveys } from "@/components/contributing-surveys";
import { PageHeader } from "@/components/page-header";
import { SeoSection } from "@/components/seo-section";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import {
  partySeries,
  surveysWithinDays,
  weightedAverage,
  weightedAverageBreakdown,
} from "@/lib/dawum";
import { partyColorVar } from "@/lib/dawum/colors";
import { PARTIES } from "@/lib/parties";
import { buildMetadata, PAGE_META, SEO_SECTION_TITLES } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.parteien,
  path: "/partei",
});

export default async function PartiesOverviewPage() {
  const { bundestag } = await loadBundestagData();
  const within30 = surveysWithinDays(bundestag, 30);
  const weighted = weightedAverage(within30);
  // The surveys feeding every card's average (provenance for the whole set).
  const contributors = weightedAverageBreakdown(within30);

  // One card per party: current weighted value, with latest as fallback.
  const cards = PARTIES.map((party) => {
    const current = weighted.find((p) => party.aliases.includes(p.shortcut));
    const series = partySeries(bundestag, (s) => party.aliases.includes(s));
    return {
      party,
      value: current?.percent ?? series.latest?.percent,
      count: series.points.length,
    };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        title={t("partyPage.overviewTitle")}
        subtitle={t("partyPage.overviewSubtitle")}
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map(({ party, value }) => (
          <li key={party.slug}>
            <Link
              href={`/partei/${party.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong hover:bg-brand-soft"
            >
              <span
                aria-hidden="true"
                className="inline-block h-6 w-6 shrink-0 rounded-full"
                style={{ backgroundColor: partyColorVar(party.shortcut) }}
              />
              <span className="flex-1 font-medium">{party.name}</span>
              <span className="font-display text-lg font-bold tabular-nums">
                {value !== undefined ? `${value.toFixed(1)} %` : "—"}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {contributors.length > 0 ? (
        <div className="mt-6">
          <p className="mb-2 text-xs text-muted">
            {t("partyPage.overviewContributorsHint")}
          </p>
          <ContributingSurveys contributors={contributors} className="" />
        </div>
      ) : null}

      <SeoSection title={SEO_SECTION_TITLES.parteien}>
        <p>
          Diese Übersicht zeigt für jede im Bundestag relevante Partei den
          aktuellen gewichteten Schnitt der Sonntagsfrage. Über die einzelnen
          Parteiseiten lassen sich der Umfrageverlauf über die Zeit sowie der
          Höchst- und Tiefstwert aller seit 2017 erfassten Umfragen aufrufen.
          Die Werte sind eine aggregierte Darstellung öffentlich verfügbarer
          Umfragen und stellen keine Wahlprognose dar.
        </p>
      </SeoSection>
    </div>
  );
}
