import type { Metadata } from "next";
import { Suspense } from "react";
import { CoalitionBuilder } from "@/components/coalition-builder";
import { JsonLd } from "@/components/json-ld";
import { MajorityCoalitions } from "@/components/majority-coalitions";
import { PageHeader } from "@/components/page-header";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import {
  currentAverage,
  findMajorityCoalitions,
  latestPerInstitute,
  surveysWithinDays,
} from "@/lib/dawum";
import { formatDate, formatDateTime } from "@/lib/format";
import { SeoSection } from "@/components/seo-section";
import { breadcrumbLd, buildMetadata, PAGE_INTRO, PAGE_META } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.koalition,
  path: "/koalition",
});

export default function KoalitionPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("koalitionPage.title"), path: "/koalition" },
        ])}
      />
      <PageHeader
        title={t("koalitionPage.title")}
        subtitle={t("koalitionPage.subtitle")}
      />
      <Suspense fallback={<BuilderSkeleton />}>
        <Koalition />
      </Suspense>

      <SeoSection title="Über den Koalitionsrechner">
        <p>{PAGE_INTRO.koalition}</p>
      </SeoSection>
    </div>
  );
}

async function Koalition() {
  const { bundestag, lastUpdate } = await loadBundestagData();

  // Build on the averaged current standing (latest poll per active institute),
  // not a single survey — one outlier shouldn't dominate coalition arithmetic,
  // and this matches the "Aktueller Stand" on /trend.
  const latest = latestPerInstitute(surveysWithinDays(bundestag, 365));
  const average = currentAverage(latest);

  if (average.length === 0) {
    return (
      <p data-testid="empty-state" className="text-sm text-muted">
        {t("common.noSurveys")}
      </p>
    );
  }

  // "As of" the newest survey feeding the average.
  const asOf = bundestag[0]?.date;

  return (
    <>
      <p data-testid="data-freshness" className="mb-4 text-xs text-muted">
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      <CoalitionBuilder
        parties={average.map((p) => ({
          shortcut: p.shortcut,
          percent: p.percent,
        }))}
        surveyLabel={t("koalitionPage.basisAverage", {
          institutes: latest.length,
          date: asOf ? formatDate(asOf) : "—",
        })}
      />
      <MajorityCoalitions
        coalitions={findMajorityCoalitions(
          average.map((p) => ({ shortcut: p.shortcut, percent: p.percent })),
        )}
      />
    </>
  );
}

function BuilderSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />
  );
}
