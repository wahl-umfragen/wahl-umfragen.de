import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SeoSection } from "@/components/seo-section";
import { t } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
import { BUNDESTAG_ELECTIONS } from "@/lib/elections/results";
import { buildElectionTable } from "@/lib/elections/table";
import { formatDate } from "@/lib/format";
import {
  breadcrumbLd,
  buildMetadata,
  PAGE_INTRO,
  PAGE_META,
  SEO_SECTION_TITLES,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.wahlen,
  path: "/wahlen",
});

/** 5-%-Hürde — below this a party doesn't enter the Bundestag (no Grundmandate). */
const THRESHOLD = 5;

/** German percentage: comma decimal, 1–3 decimals so sub-5 results like
 * BSW 4,981 stay honestly visible (one decimal would round them to "5,0"). */
function formatPercent(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 3,
  });
}

export default function WahlenPage() {
  const table = buildElectionTable(BUNDESTAG_ELECTIONS);
  const source = BUNDESTAG_ELECTIONS.at(-1)?.source;
  const hasBelowThreshold = table.rows.some((r) =>
    r.cells.some((c) => c !== null && c < THRESHOLD),
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("wahlenPage.title"), path: "/wahlen" },
        ])}
      />
      <PageHeader
        title={t("wahlenPage.title")}
        subtitle={t("wahlenPage.subtitle")}
      />

      {table.rows.length === 0 ? (
        <p data-testid="empty-state" className="text-sm text-muted">
          {t("common.noData")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table data-testid="election-results" className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border-strong bg-surface-2 text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">
                  {t("wahlenPage.party")}
                </th>
                {table.columns.map((c) => (
                  <th
                    key={c.date}
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide tabular-nums"
                  >
                    <span className="block">{c.label}</span>
                    <span className="block text-xs font-normal normal-case tracking-normal text-muted">
                      {formatDate(c.date)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr
                  key={row.shortcut}
                  className="border-b border-border last:border-0 hover:bg-brand-soft"
                >
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: partyColorVar(row.shortcut) }}
                      />
                      {row.shortcut}
                    </span>
                  </th>
                  {row.cells.map((cell, i) => {
                    const below = cell !== null && cell < THRESHOLD;
                    return (
                      <td
                        key={table.columns[i]?.date ?? i}
                        className={`px-4 py-2.5 text-right font-mono tabular-nums ${
                          below ? "text-muted" : ""
                        }`}
                      >
                        {cell === null ? (
                          <span className="text-border-strong">–</span>
                        ) : (
                          <>
                            {formatPercent(cell)}&nbsp;%
                            {below ? "*" : ""}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasBelowThreshold ? (
        <p className="mt-3 text-xs text-muted">
          {t("wahlenPage.thresholdNote")}
        </p>
      ) : null}

      {source ? (
        <p className="mt-2 text-xs text-muted">
          {t("wahlenPage.sourcePrefix")}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {source.name}
          </a>
        </p>
      ) : null}

      <SeoSection title={SEO_SECTION_TITLES.wahlen}>
        <p>{PAGE_INTRO.wahlen}</p>
      </SeoSection>
    </div>
  );
}
