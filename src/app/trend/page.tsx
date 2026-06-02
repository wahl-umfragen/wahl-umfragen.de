import { Suspense } from "react";
import { TrendChartClient } from "@/components/trend-chart-client";
import { buildBundestagTrend, loadBundestagData } from "@/lib/dawum";
import { formatDateTime } from "@/lib/format";

export const revalidate = 900;

export default function TrendPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Trend (90 Tage)
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Verlauf der Sonntagsfrage über die letzten 90 Tage.
        </p>
      </header>
      <Suspense fallback={<ChartSkeleton />}>
        <Trend />
      </Suspense>
    </div>
  );
}

async function Trend() {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const trend = buildBundestagTrend(bundestag, { windowDays: 90 });

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-4 text-xs text-zinc-500 dark:text-zinc-400"
      >
        Stand: {formatDateTime(lastUpdate)}
      </p>
      <TrendChartClient data={trend} />
    </>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
  );
}
