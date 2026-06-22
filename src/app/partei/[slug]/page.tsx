import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributingSurveys } from "@/components/contributing-surveys";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { PartySparkline } from "@/components/party-sparkline";
import { SeoSection } from "@/components/seo-section";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import {
  partySeries,
  seatDistribution,
  surveysWithinDays,
  weightedAverage,
  weightedAverageBreakdown,
} from "@/lib/dawum";
import { partyColorVar } from "@/lib/dawum/colors";
import { formatDate } from "@/lib/format";
import { PARTIES, partyBySlug } from "@/lib/parties";
import { absoluteUrl, breadcrumbLd, buildMetadata } from "@/lib/seo";

/** Pre-render every registered party page at build time (small, known set). */
export function generateStaticParams() {
  return PARTIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const party = partyBySlug(slug);
  if (!party) return {};
  return buildMetadata({
    title: `${party.name} Umfragen – Sonntagsfrage Bundestag`,
    description: `Aktuelle Umfragewerte für ${party.name} zur Bundestagswahl: gewichteter Schnitt der Sonntagsfrage, Verlauf über die Zeit sowie Höchst- und Tiefstwert aller erfassten Umfragen.`,
    path: `/partei/${slug}`,
  });
}

export default async function PartyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const party = partyBySlug(slug);
  if (!party) notFound();

  const { bundestag } = await loadBundestagData();
  const matches = (s: string) => party.aliases.includes(s);
  const series = partySeries(bundestag, matches);

  // Weighted poll-of-polls value for this party (last 30 days), else latest.
  const within30 = surveysWithinDays(bundestag, 30);
  const weightedAll = weightedAverage(within30);
  const weighted = weightedAll.find((p) => party.aliases.includes(p.shortcut));
  const current = weighted?.percent ?? series.latest?.percent;
  // Provenance for the "Aktueller Schnitt": the windowed surveys that actually
  // reported this party, each with its relative weight — the same breakdown the
  // dashboard's poll of polls shows, scoped to this party.
  const contributors = weightedAverageBreakdown(
    within30.filter((s) => s.results.some((r) => matches(r.shortcut))),
  );
  // Projected Bundestag seats from the same weighted poll of polls.
  const seats = seatDistribution(weightedAll);
  const partySeats = seats.entries.find((e) =>
    party.aliases.includes(e.shortcut),
  )?.seats;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("partyPage.overviewTitle"), path: "/partei" },
          { name: party.name, path: `/partei/${slug}` },
        ])}
      />
      {/* Entity link so search engines connect this page to the party's
          Wikipedia entity (helps the Knowledge Graph). */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: party.name,
          url: absoluteUrl(`/partei/${slug}`),
          sameAs: [party.wikipedia],
        }}
      />
      <Link
        href="/partei"
        className="text-sm font-medium text-muted hover:text-foreground"
      >
        {t("partyPage.back")}
      </Link>

      <div className="mt-4 mb-8 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-block h-7 w-7 shrink-0 rounded-full"
          style={{ backgroundColor: partyColorVar(party.shortcut) }}
        />
        <PageHeader title={party.name} />
      </div>

      {series.points.length === 0 ? (
        <p className="text-sm text-muted">{t("partyPage.noData")}</p>
      ) : (
        <>
          <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5">
            <Stat
              label={t("partyPage.current")}
              hint={t("partyPage.currentHint")}
            >
              {current !== undefined ? `${current.toFixed(1)} %` : "—"}
            </Stat>
            <Stat label={t("partyPage.seats")} hint={t("partyPage.seatsHint")}>
              {partySeats ?? "—"}
            </Stat>
            <Stat label={t("partyPage.latest")}>
              {series.latest ? `${series.latest.percent.toFixed(1)} %` : "—"}
              {series.latest ? (
                <span className="block text-xs font-normal text-muted">
                  {formatDate(series.latest.date)}
                </span>
              ) : null}
            </Stat>
            <Stat label={t("partyPage.high")}>
              {series.high ? `${series.high.percent.toFixed(1)} %` : "—"}
              {series.high ? (
                <span className="block text-xs font-normal text-muted">
                  {formatDate(series.high.date)}
                </span>
              ) : null}
            </Stat>
            <Stat label={t("partyPage.low")}>
              {series.low ? `${series.low.percent.toFixed(1)} %` : "—"}
              {series.low ? (
                <span className="block text-xs font-normal text-muted">
                  {formatDate(series.low.date)}
                </span>
              ) : null}
            </Stat>
          </dl>

          {contributors.length > 0 ? (
            <section className="mb-10">
              <p className="mb-2 text-xs text-muted">
                {t("partyPage.contributorsHint")}
              </p>
              <ContributingSurveys contributors={contributors} className="" />
            </section>
          ) : null}

          <section className="mb-10">
            <h2 className="eyebrow mb-3">{t("partyPage.trendTitle")}</h2>
            <PartySparkline
              points={series.points}
              shortcut={party.shortcut}
              label={`Umfrageverlauf ${party.name}`}
            />
            {series.points.length > 2 ? (
              <p className="mt-2 text-[11px] text-muted">
                {t("partyPage.trendNote")}
              </p>
            ) : null}
          </section>

          <section className="mb-10">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="eyebrow">{t("partyPage.recentTitle")}</h2>
              <span className="flex items-center gap-2 text-xs text-muted">
                {t("partyPage.export")}
                <a
                  href={`/api/surveys?format=csv&partei=${slug}`}
                  className="font-medium underline underline-offset-2 hover:text-foreground"
                >
                  CSV
                </a>
                <a
                  href={`/api/surveys?partei=${slug}`}
                  className="font-medium underline underline-offset-2 hover:text-foreground"
                >
                  JSON
                </a>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-border-strong text-left text-xs font-bold uppercase tracking-wide text-muted">
                    <th scope="col" className="py-2 pr-3">
                      {t("partyPage.tableInstitute")}
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      {t("partyPage.tableDate")}
                    </th>
                    <th scope="col" className="py-2 pr-3 text-right">
                      {t("partyPage.tableValue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...series.points]
                    .reverse()
                    .slice(0, 15)
                    .map((p) => (
                      <tr
                        key={p.surveyId}
                        className="border-b border-border last:border-0 hover:bg-brand-soft"
                      >
                        <td className="py-2 pr-3 font-medium">
                          <Link
                            href={`/archiv/${p.surveyId}`}
                            className="hover:underline"
                          >
                            {p.institute}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap py-2 pr-3 text-muted">
                          {formatDate(p.date)}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono tabular-nums">
                          {p.percent.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <SeoSection title={`${party.name} in der Sonntagsfrage`}>
            <p>
              Diese Seite bündelt die Umfragewerte für {party.name} zur
              Bundestagswahl. Der aktuelle Schnitt ist ein gewichteter
              Poll-of-Polls-Wert über die Umfragen der letzten 30 Tage –
              aktuellere und größere Erhebungen zählen stärker. Höchst- und
              Tiefstwert beziehen sich auf alle seit 2017 erfassten Umfragen.
              Die Werte sind eine aggregierte Darstellung öffentlicher Umfragen
              und keine Wahlprognose.
            </p>
          </SeoSection>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-xl font-bold">{children}</dd>
      {hint ? <p className="mt-0.5 text-[0.65rem] text-muted">{hint}</p> : null}
    </div>
  );
}
