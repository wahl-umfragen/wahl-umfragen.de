import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SeoSection } from "@/components/seo-section";
import { t, type TranslationKey } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import {
  comparePartyAverages,
  NON_PARTISAN,
  weightedAverage,
} from "@/lib/dawum";
import { partyColorVar } from "@/lib/dawum/colors";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { breadcrumbLd, buildMetadata, PAGE_META } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.vergleich,
  path: "/vergleich",
});

/** Selectable look-back distances (days) and their i18n labels. */
const PERIODS: { days: number; label: TranslationKey }[] = [
  { days: 30, label: "comparePage.m1" },
  { days: 90, label: "comparePage.m3" },
  { days: 180, label: "comparePage.m6" },
  { days: 365, label: "comparePage.m12" },
];
const DEFAULT_DAYS = 90;
const DAY = 86_400_000;

/** Surveys whose date falls in [fromMs, toMs]. */
function inRange(surveys: NormalizedSurvey[], fromMs: number, toMs: number) {
  return surveys.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= fromMs && t <= toMs;
  });
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ vor?: string }>;
}) {
  const { vor } = await searchParams;
  const days =
    PERIODS.find((p) => String(p.days) === vor)?.days ?? DEFAULT_DAYS;

  const { bundestag } = await loadBundestagData();

  let rows: ReturnType<typeof comparePartyAverages> = [];
  if (bundestag.length > 0) {
    const newest = new Date(bundestag[0].date).getTime();
    // "Now": last 30 days. "Then": the 30-day window ending `days` ago.
    const now = weightedAverage(inRange(bundestag, newest - 30 * DAY, newest));
    const anchor = newest - days * DAY;
    const then = weightedAverage(inRange(bundestag, anchor - 30 * DAY, anchor));
    rows = comparePartyAverages(now, then).filter(
      (r) => !NON_PARTISAN.has(r.shortcut),
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("comparePage.title"), path: "/vergleich" },
        ])}
      />
      <PageHeader
        title={t("comparePage.title")}
        subtitle={t("comparePage.subtitle")}
      />

      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{t("comparePage.periodLabel")}</span>
        {PERIODS.map((p) => {
          const active = p.days === days;
          return (
            <Link
              key={p.days}
              href={`/vergleich?vor=${p.days}`}
              aria-current={active ? "true" : undefined}
              className={`rounded-md px-3 py-1 font-medium transition-colors ${
                active
                  ? "bg-brand text-brand-foreground"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {t(p.label)}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t("comparePage.noData")}</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-border-strong text-left text-xs font-bold uppercase tracking-wide text-muted">
                <th scope="col" className="py-2 pr-3">
                  {t("comparePage.party")}
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  {t("comparePage.then")}
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  {t("comparePage.now")}
                </th>
                <th scope="col" className="py-2 pr-3 text-right">
                  {t("comparePage.delta")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.shortcut}
                  className="border-b border-border last:border-0"
                >
                  <th scope="row" className="py-2 pr-3 text-left font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: partyColorVar(r.shortcut) }}
                      />
                      {r.shortcut}
                    </span>
                  </th>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums text-muted">
                    {r.previous !== undefined ? r.previous.toFixed(1) : "–"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">
                    {r.current !== undefined ? r.current.toFixed(1) : "–"}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono tabular-nums">
                    {r.delta === undefined || r.delta === 0 ? (
                      <span className="text-muted">±0,0</span>
                    ) : (
                      <span
                        className={
                          r.delta > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {r.delta > 0 ? "+" : "−"}
                        {Math.abs(r.delta).toFixed(1)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SeoSection title="Wie sich die Umfragen verändert haben">
        <p>
          Diese Gegenüberstellung vergleicht den aktuellen gewichteten Schnitt
          der Sonntagsfrage (letzte 30 Tage) mit dem Stand zum gewählten
          früheren Zeitpunkt. Die Veränderung ist die Differenz in
          Prozentpunkten. Die Werte sind eine aggregierte Darstellung
          öffentlicher Umfragen und keine Wahlprognose.
        </p>
      </SeoSection>
    </div>
  );
}
