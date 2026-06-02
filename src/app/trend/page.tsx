import { Suspense } from "react";
import { PollDashboardClient } from "@/components/poll-dashboard-client";
import { RecentSurveys } from "@/components/recent-surveys";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import {
  buildBundestagTrend,
  currentAverage,
  instituteComparison,
  latestPerInstitute,
  seatDistribution,
  TREND_WINDOW_DAYS,
  type TrendWindowKey,
  type TrendWindows,
} from "@/lib/dawum";
import { formatDateTime } from "@/lib/format";

export default function TrendPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("trendPage.title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("trendPage.subtitle")}
        </p>
      </header>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

async function Dashboard() {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const latest = latestPerInstitute(bundestag);
  const average = currentAverage(latest);

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
        className="mb-6 text-xs text-zinc-500 dark:text-zinc-400"
      >
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      <PollDashboardClient
        average={average}
        trends={trends}
        seats={seatDistribution(average)}
        comparison={instituteComparison(latest)}
      />
      <div className="mt-10">
        <RecentSurveys surveys={bundestag} />
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-72 w-full animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}
