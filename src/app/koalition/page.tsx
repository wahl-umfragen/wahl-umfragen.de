import type { Metadata } from "next";
import { Suspense } from "react";
import { CoalitionBuilder } from "@/components/coalition-builder";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
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
  const mostRecent = bundestag[0];

  if (!mostRecent) {
    return (
      <p
        data-testid="empty-state"
        className="text-sm text-muted"
      >
        {t("common.noSurveys")}
      </p>
    );
  }

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-4 text-xs text-muted"
      >
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      <CoalitionBuilder
        parties={mostRecent.results.map((r) => ({
          shortcut: r.shortcut,
          percent: r.percent,
        }))}
        surveyLabel={`${mostRecent.institute.name}, ${formatDate(mostRecent.date)}`}
      />
    </>
  );
}

function BuilderSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-xl border border-border bg-surface" />
  );
}
