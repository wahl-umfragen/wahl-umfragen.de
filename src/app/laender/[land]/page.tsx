import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { PollDashboardClient } from "@/components/poll-dashboard-client";
import { t } from "@/i18n";
import { loadParliamentData } from "@/lib/data";
import { seatDistribution } from "@/lib/dawum";
import { buildDashboardData } from "@/lib/dashboard";
import { formatDateTime } from "@/lib/format";
import { parliamentBySlug, STATE_PARLIAMENTS } from "@/lib/parliaments";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return STATE_PARLIAMENTS.map((p) => ({ land: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ land: string }>;
}): Promise<Metadata> {
  const { land } = await params;
  const p = parliamentBySlug(land);
  if (!p) return {};
  return buildMetadata({
    title: `Wahlumfragen ${p.name} – ${p.parliamentName}`,
    description: `Aktuelle Umfragen zur Landtagswahl in ${p.name}: Wahltrend je Partei, Sitzverteilung im ${p.parliamentName} (5-%-Hürde) und Institutsvergleich.`,
    path: `/laender/${p.slug}`,
  });
}

export default async function LandPage({
  params,
}: {
  params: Promise<{ land: string }>;
}) {
  const { land } = await params;
  const parliament = parliamentBySlug(land);
  if (!parliament) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("laenderPage.title"), path: "/laender" },
          { name: parliament.name, path: `/laender/${parliament.slug}` },
        ])}
      />
      <PageHeader
        title={`Umfragen ${parliament.name}`}
        subtitle={`Wahltrend, Sitzverteilung und Institutsvergleich für den ${parliament.parliamentName}.`}
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <StateDashboard
          id={parliament.id}
          totalSeats={parliament.totalSeats}
          threshold={parliament.threshold}
        />
      </Suspense>
    </div>
  );
}

async function StateDashboard({
  id,
  totalSeats,
  threshold,
}: {
  id: string;
  totalSeats: number;
  threshold: number;
}) {
  const { surveys, lastUpdate } = await loadParliamentData(id);
  if (surveys.length === 0) {
    return (
      <p data-testid="empty-state" className="text-sm text-muted">
        {t("common.noSurveys")}
      </p>
    );
  }

  const d = buildDashboardData(surveys);

  return (
    <>
      <p data-testid="data-freshness" className="mb-6 text-xs text-muted">
        {t("common.asOf")} {lastUpdate ? formatDateTime(lastUpdate) : "—"}
      </p>
      <PollDashboardClient
        average={d.average}
        trends={d.trends}
        seats={seatDistribution(d.average, totalSeats, threshold)}
        comparison={d.comparison}
        comparisonWindows={d.comparisonWindows}
        houseEffects={d.houseEffects}
        contributingSurveys={d.contributingSurveys}
        showElectionMarkers={false}
        parliamentId={id}
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
          className="h-72 w-full animate-pulse rounded-xl border border-border bg-surface"
        />
      ))}
    </div>
  );
}
