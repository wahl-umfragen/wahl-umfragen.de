import { Suspense } from "react";
import { InstituteTable } from "@/components/institute-table";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { PollOfPolls } from "@/components/poll-of-polls";
import { RecentSurveys } from "@/components/recent-surveys";
import { FaqSection, SeoSection } from "@/components/seo-section";
import { t } from "@/i18n";
import { loadBundestagData } from "@/lib/data";
import {
  instituteDeltas,
  latestPerInstitute,
  surveysWithinDays,
  weightedAverage,
} from "@/lib/dawum";
import { formatDateTime } from "@/lib/format";
import { PAGE_INTRO, websiteLd } from "@/lib/seo";

/** Institutes whose latest poll is older than this are treated as inactive and
 * hidden from the current-standing table. */
const RECENT_DAYS = 365;

export default function Page() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader title={t("home.title")} subtitle={t("home.subtitle")} />
      <Suspense fallback={<TableSkeleton />}>
        <Surveys />
      </Suspense>

      <SeoSection title="Aktuelle Umfragen zur Bundestagswahl">
        <p>{PAGE_INTRO.home}</p>
      </SeoSection>
      <FaqSection />

      <JsonLd data={websiteLd()} />
    </div>
  );
}

async function Surveys() {
  const { bundestag, lastUpdate } = await loadBundestagData();
  // Only institutes that polled within the last year — drop ones that stopped.
  const latest = latestPerInstitute(surveysWithinDays(bundestag, RECENT_DAYS));
  // Per-row change vs each institute's previous poll (computed over full history).
  const deltas = instituteDeltas(bundestag);
  // Poll of polls: weighted average over the last 30 days of surveys.
  const recent = surveysWithinDays(bundestag, 30);
  const pollOfPolls = weightedAverage(recent);

  return (
    <>
      <p
        data-testid="data-freshness"
        className="mb-4 text-xs text-muted"
      >
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      {latest.length === 0 ? (
        <p
          data-testid="empty-state"
          className="text-sm text-muted"
        >
          {t("common.noSurveys")}
        </p>
      ) : (
        <>
          {pollOfPolls.length > 0 ? (
            <PollOfPolls average={pollOfPolls} basisCount={recent.length} />
          ) : null}
          <InstituteTable surveys={latest} deltas={deltas} />
          <div className="mt-10">
            <RecentSurveys surveys={bundestag} />
          </div>
        </>
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div
      data-testid="surveys-skeleton"
      className="h-80 animate-pulse rounded-xl border border-border bg-surface"
    />
  );
}
