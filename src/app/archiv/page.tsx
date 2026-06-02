import { Suspense } from "react";
import { SurveyArchive } from "@/components/survey-archive";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export default function ArchivPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("archivePage.title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("archivePage.subtitle")}
        </p>
      </header>
      <Suspense fallback={<ArchiveSkeleton />}>
        <Archive />
      </Suspense>
    </div>
  );
}

async function Archive() {
  const { bundestag, lastUpdate } = await loadBundestagData();

  if (bundestag.length === 0) {
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
      <SurveyArchive surveys={bundestag} />
    </>
  );
}

function ArchiveSkeleton() {
  return (
    <div
      data-testid="archive-skeleton"
      className="h-96 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    />
  );
}
