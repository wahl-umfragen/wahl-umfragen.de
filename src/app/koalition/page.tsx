import { Suspense } from "react";
import { CoalitionBuilder } from "@/components/coalition-builder";
import { loadBundestagData } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";

// Reads from Postgres at request time (Phase 2); never prerender at build.
export const dynamic = "force-dynamic";

export default function KoalitionPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Koalitionsrechner
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Parteien auf Basis der aktuellsten Umfrage zu einer Koalition
          kombinieren.
        </p>
      </header>
      <Suspense fallback={<BuilderSkeleton />}>
        <Koalition />
      </Suspense>
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
        className="text-sm text-zinc-600 dark:text-zinc-400"
      >
        Keine Umfragen verfügbar.
      </p>
    );
  }

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-4 text-xs text-zinc-500 dark:text-zinc-400"
      >
        Stand: {lastUpdate ? formatDateTime(lastUpdate) : "—"}
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
    <div className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
  );
}
