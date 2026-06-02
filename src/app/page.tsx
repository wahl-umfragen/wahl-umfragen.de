import { Suspense } from "react";
import { InstituteTable } from "@/components/institute-table";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import { latestPerInstitute } from "@/lib/dawum";
import { formatDateTime } from "@/lib/format";

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("home.title")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("home.subtitle")}
        </p>
      </header>
      <Suspense fallback={<TableSkeleton />}>
        <Surveys />
      </Suspense>
    </div>
  );
}

async function Surveys() {
  const { bundestag, lastUpdate } = await loadBundestagData();
  const latest = latestPerInstitute(bundestag);

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-4 text-xs text-zinc-500 dark:text-zinc-400"
      >
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      {latest.length === 0 ? (
        <p
          data-testid="empty-state"
          className="text-sm text-zinc-600 dark:text-zinc-400"
        >
          {t("common.noSurveys")}
        </p>
      ) : (
        <InstituteTable surveys={latest} />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div
      data-testid="surveys-skeleton"
      className="h-80 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    />
  );
}
