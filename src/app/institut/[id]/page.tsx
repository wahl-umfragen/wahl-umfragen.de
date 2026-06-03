import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { RecentSurveys } from "@/components/recent-surveys";
import { TrendChartClient } from "@/components/trend-chart-client";
import { t } from "@/i18n";
import { loadSurveysByInstitute } from "@/lib/data";
import {
  buildBundestagTrend,
  smoothTrendData,
  TREND_WINDOW_DAYS,
} from "@/lib/dawum";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { formatDate } from "@/lib/format";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

/** All surveys from one institute, newest first. */
async function findInstitute(
  id: string,
): Promise<{ name: string; surveys: NormalizedSurvey[] } | undefined> {
  const surveys = await loadSurveysByInstitute(id);
  if (surveys.length === 0) return undefined;
  return { name: surveys[0].institute.name, surveys };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const institute = await findInstitute(id);
  if (!institute) return {};
  const { name, surveys } = institute;
  const sinceYear = new Date(surveys[surveys.length - 1].date).getFullYear();
  return buildMetadata({
    title: `Umfragen von ${name}`,
    description: `Alle ${surveys.length} Bundestags-Umfragen des Instituts ${name} seit ${sinceYear}: Umfrageverlauf je Partei, Werte im Detail und Einordnung der Sonntagsfrage.`,
    path: `/institut/${id}`,
  });
}

export default async function InstituteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const institute = await findInstitute(id);
  if (!institute) notFound();

  const { name, surveys } = institute;
  const newest = surveys[0];
  const oldest = surveys[surveys.length - 1];

  // Trend over this institute's own surveys (so no house-effect averaging, just
  // its reported series over time). Smooth for readability over long histories.
  const trend = smoothTrendData(
    buildBundestagTrend(surveys, { windowDays: TREND_WINDOW_DAYS.all }),
    5,
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name, path: `/institut/${id}` },
        ])}
      />
      <Link
        href="/"
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
