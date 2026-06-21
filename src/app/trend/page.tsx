import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { PollDashboardClient } from "@/components/poll-dashboard-client";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import { seatDistribution } from "@/lib/dawum";
import { buildDashboardData } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/format";
import { SeoSection } from "@/components/seo-section";
import { breadcrumbLd, buildMetadata, PAGE_INTRO, PAGE_META } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  ...PAGE_META.trend,
  path: "/trend",
});

export default function TrendPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("trendPage.title"), path: "/trend" },
        ])}
      />
      <PageHeader
        title={t("trendPage.title")}
        subtitle={t("trendPage.subtitle")}
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>

      <SeoSection title="Über den Wahltrend">
        <p>{PAGE_INTRO.trend}</p>
      </SeoSection>
    </div>
  );
}

async function Dashboard() {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const d = buildDashboardData(bundestag);

  return (
    <>
      <p data-testid="data-freshness" className="mb-6 text-xs text-muted">
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      <PollDashboardClient
        average={d.average}
        trends={d.trends}
        seats={seatDistribution(d.average)}
        comparison={d.comparison}
        comparisonWindows={d.comparisonWindows}
        houseEffects={d.houseEffects}
        contributingSurveys={d.contributingSurveys}
      />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-72 w-full animate-pulse rounded-xl border border-border bg-surface"
        />
      ))}
    </div>
  );
}
