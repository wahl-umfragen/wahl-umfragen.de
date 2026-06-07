import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { RecentSurveys } from "@/components/recent-surveys";
import { TrendChartClient } from "@/components/trend-chart-client";
import { t } from "@/i18n";
import { loadSurveysByInstitute, loadSurveysByInstituteAndParliament } from "@/lib/data";
import {
  buildBundestagTrend,
  smoothTrendData,
  TREND_WINDOW_DAYS,
} from "@/lib/dawum";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { BUNDESTAG_PARLIAMENT_ID } from "@/lib/dawum/types";
import { formatDate } from "@/lib/format";
import { STATE_PARLIAMENTS } from "@/lib/parliaments";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

function parliamentLabel(parliamentId: string): string {
  if (parliamentId === BUNDESTAG_PARLIAMENT_ID) return "Bundestags";
  const p = STATE_PARLIAMENTS.find((s) => s.id === parliamentId);
  return p ? `${p.name}-Landtags` : "Landtags";
}

/** All surveys from one institute for the given parliament, newest first. */
async function findInstitute(
  id: string,
  parliamentId: string,
): Promise<{ name: string; surveys: NormalizedSurvey[] } | undefined> {
  const surveys =
    parliamentId === BUNDESTAG_PARLIAMENT_ID
      ? await loadSurveysByInstitute(id)
      : await loadSurveysByInstituteAndParliament(id, parliamentId);
  if (surveys.length === 0) return undefined;
  return { name: surveys[0].institute.name, surveys };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { p } = await searchParams;
  const parliamentId = p ?? BUNDESTAG_PARLIAMENT_ID;
  const institute = await findInstitute(id, parliamentId);
  if (!institute) return {};
  const { name, surveys } = institute;
  const sinceYear = new Date(surveys[surveys.length - 1].date).getFullYear();
  const label = parliamentLabel(parliamentId);
  return buildMetadata({
    title: `Umfragen von ${name}`,
    description: `Alle ${surveys.length} ${label}-Umfragen des Instituts ${name} seit ${sinceYear}: Umfrageverlauf je Partei, Werte im Detail und Einordnung der Sonntagsfrage.`,
    path: `/institut/${id}`,
  });
}

export default async function InstituteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id } = await params;
  const { p } = await searchParams;
  const parliamentId = p ?? BUNDESTAG_PARLIAMENT_ID;
  const institute = await findInstitute(id, parliamentId);
  if (!institute) notFound();

  const { name, surveys } = institute;
  const newest = surveys[0];
  const oldest = surveys[surveys.length - 1];

  // Trend over this institute's own surveys (so no house-effect averaging, just
  // its reported series over time). Smooth for readability over long histories.
  // buildBundestagTrend is parliament-agnostic despite its name.
  const trend = smoothTrendData(
    buildBundestagTrend(surveys, { windowDays: TREND_WINDOW_DAYS.all }),
    5,
  );

  const backHref =
    parliamentId === BUNDESTAG_PARLIAMENT_ID
      ? "/"
      : (() => {
          const p = STATE_PARLIAMENTS.find((s) => s.id === parliamentId);
          return p ? `/laender/${p.slug}` : "/";
        })();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name, path: `/institut/${id}` },
        ])}
      />
      <Link
        href={backHref}
        className="text-sm font-medium text-muted hover:text-foreground"
      >
        {t("institute.back")}
      </Link>

      <PageHeader title={name} className="mt-4 mb-8" />

      <dl
        data-testid="institute-meta"
        className="mb-10 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3"
      >
        <Meta label={t("institute.surveysCount")}>
          {surveys.length.toLocaleString("de-DE")}
        </Meta>
        <Meta label={t("institute.period")}>
          {formatDate(oldest.date)} – {formatDate(newest.date)}
        </Meta>
        <Meta label={t("institute.latest")}>{formatDate(newest.date)}</Meta>
      </dl>

      <section className="mb-10">
        <h3 className="eyebrow mb-3">{t("institute.trendTitle")}</h3>
        <p className="-mt-2 mb-3 text-xs text-muted">
          {t("institute.trendHint")}
        </p>
        <TrendChartClient data={trend} showDots={false} smoothed />
      </section>

      <RecentSurveys
        surveys={surveys}
        limit={20}
        showInstitute={false}
        title={t("institute.listTitle")}
        viewAllHref={`/archiv?institut=${id}`}
        viewAllLabel={t("institute.viewAllInArchive")}
      />
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
