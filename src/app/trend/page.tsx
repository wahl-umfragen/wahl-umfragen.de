import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { PollDashboardClient } from "@/components/poll-dashboard-client";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import {
  buildBundestagTrend,
  currentAverage,
  instituteComparison,
  latestPerInstitute,
  seatDistribution,
  surveysWithinDays,
  TREND_WINDOW_DAYS,
  type TrendWindowKey,
  type TrendWindows,
} from "@/lib/dawum";
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
  // Current standing & institute comparison only count institutes that polled
  // within the last year, so ones that stopped don't skew the average.
  const latest = latestPerInstitute(surveysWithinDays(bundestag, 365));
  const average = currentAverage(latest);

  // Transparency: the exact surveys averaged into "Aktueller Stand", newest
  // first. Slim shape so the client payload stays small.
  const contributingSurveys = latest
    .map((s) => ({
      id: s.id,
      instituteId: s.institute.id,
      institute: s.institute.name,
      date: s.date,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Precompute one trend per selectable window; the dashboard switches between
  // them client-side without another server round-trip.
  const trends = Object.fromEntries(
    (Object.entries(TREND_WINDOW_DAYS) as [TrendWindowKey, number][]).map(
      ([key, days]) => [key, buildBundestagTrend(bundestag, { windowDays: days })],
    ),
  ) as TrendWindows;

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-6 text-xs text-muted"
      >
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      <PollDashboardClient
        average={average}
        trends={trends}
        seats={seatDistribution(average)}
        comparison={instituteComparison(latest)}
        contributingSurveys={contributingSurveys}
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
