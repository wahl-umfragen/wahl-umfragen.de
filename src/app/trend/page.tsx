import { Suspense } from "react";
import { PollDashboardClient } from "@/components/poll-dashboard-client";
import { loadBundestagData } from "@/lib/data";
import {
  buildBundestagTrend,
  currentAverage,
  instituteComparison,
  latestPerInstitute,
  seatDistribution,
} from "@/lib/dawum";
import { formatDateTime } from "@/lib/format";

// Reads from Postgres at request time (Phase 2); never prerender at build.
export const dynamic = "force-dynamic";

export default function TrendPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Auswertung</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Aktueller Stand, Trend, Sitzverteilung und Institutsvergleich der
          Sonntagsfrage.
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

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-6 text-xs text-zinc-500 dark:text-zinc-400"
      >
        Stand: {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      <PollDashboardClient
        average={average}
        trend={buildBundestagTrend(bundestag, { windowDays: 90 })}
        seats={seatDistribution(average)}
        comparison={instituteComparison(latest)}
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
          className="h-72 w-full animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}
