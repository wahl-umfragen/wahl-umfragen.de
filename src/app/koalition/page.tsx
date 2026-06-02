import { Suspense } from "react";
import { CoalitionBuilder } from "@/components/coalition-builder";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/format";

export default function KoalitionPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("koalitionPage.title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("koalitionPage.subtitle")}
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
        {t("common.noSurveys")}
      </p>
    );
  }

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-4 text-xs text-zinc-500 dark:text-zinc-400"
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
    <div className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
  );
}
