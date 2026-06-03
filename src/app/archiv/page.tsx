import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { SeoSection } from "@/components/seo-section";
import { SurveyArchive } from "@/components/survey-archive";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import {
  breadcrumbLd,
  buildMetadata,
  datasetLd,
  PAGE_INTRO,
  PAGE_META,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.archiv,
  path: "/archiv",
});

export default function ArchivPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("archivePage.title"), path: "/archiv" },
        ])}
      />
      <PageHeader
        title={t("archivePage.title")}
        subtitle={t("archivePage.subtitle")}
      />
      <Suspense fallback={<ArchiveSkeleton />}>
        <Archive />
      </Suspense>

      <SeoSection title="Über das Umfrage-Archiv">
        <p>{PAGE_INTRO.archiv}</p>
      </SeoSection>
    </div>
  );
}

async function Archive() {
  const { bundestag, lastUpdate } = await loadBundestagData();

  if (bundestag.length === 0) {
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
      <SurveyArchive surveys={bundestag} />
      <JsonLd
        data={datasetLd({ lastUpdate, count: bundestag.length })}
      />
    </>
  );
}

function ArchiveSkeleton() {
  return (
    <div
      data-testid="archive-skeleton"
      className="h-96 animate-pulse rounded-xl border border-border bg-surface"
    />
  );
}
