import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { JsonLd } from "@/components/json-ld";
import { t } from "@/i18n";
import { partyColorVar } from "@/lib/dawum/colors";
import type { NormalizedSurvey } from "@/lib/dawum/types";
import { loadSurveyById } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";

async function findSurvey(id: string): Promise<NormalizedSurvey | undefined> {
  return (await loadSurveyById(id)) ?? undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const survey = await findSurvey(id);
  if (!survey) return {};
  const top = [...survey.results]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4)
    .map((r) => `${r.shortcut} ${r.percent.toFixed(1)} %`)
    .join(", ");
  return buildMetadata({
    title: `${survey.institute.name}, ${formatDate(survey.date)}`,
    description: `Sonntagsfrage zur Bundestagswahl von ${survey.institute.name} (${formatDate(survey.date)}): ${top}. Mit Werten je Partei, Feldzeit und Befragtenzahl.`,
    path: `/archiv/${id}`,
  });
}

export default async function SurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const survey = await findSurvey(id);
  if (!survey) notFound();

  const max = Math.max(...survey.results.map((r) => r.percent), 1);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <JsonLd
        data={breadcrumbLd([
          { name: "Startseite", path: "/" },
          { name: t("archivePage.title"), path: "/archiv" },
          {
            name: `${survey.institute.name}, ${formatDate(survey.date)}`,
            path: `/archiv/${id}`,
          },
        ])}
      />
      <BackLink
        fallbackHref="/archiv"
        label={t("detail.back")}
        className="text-sm font-medium text-muted hover:text-foreground"
      />

      <header className="mt-4 mb-8">
        <div
          aria-hidden="true"
          className="mb-3 h-1 w-12 rounded-full bg-accent"
        />
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          <Link
            href={`/institut/${survey.institute.id}`}
            className="hover:underline"
          >
            {survey.institute.name}
          </Link>
        </h1>
        <p className="mt-2 text-muted">{formatDate(survey.date)}</p>
      </header>

      <dl
        data-testid="survey-meta"
        className="mb-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3"
      >
        <Meta label={t("detail.date")}>{formatDate(survey.date)}</Meta>
        {survey.periodStart && survey.periodEnd ? (
          <Meta label={t("detail.period")}>
            {formatDate(survey.periodStart)} – {formatDate(survey.periodEnd)}
          </Meta>
        ) : null}
        {survey.method ? (
          <Meta label={t("detail.method")}>{survey.method.name}</Meta>
        ) : null}
        {survey.tasker ? (
          <Meta label={t("detail.tasker")}>{survey.tasker.name}</Meta>
        ) : null}
        {survey.surveyedPersons ? (
          <Meta label={t("detail.surveyed")}>
            {survey.surveyedPersons.toLocaleString("de-DE")}
          </Meta>
        ) : null}
      </dl>

      <h3 className="eyebrow mb-3">{t("detail.results")}</h3>
      <ul data-testid="survey-results" className="space-y-2">
        {survey.results.map((r) => (
          <li key={r.partyId} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 font-medium">{r.shortcut}</span>
            <span className="relative h-5 flex-1 overflow-hidden rounded bg-surface-2">
              <span
                className="absolute inset-y-0 left-0 rounded"
                style={{
                  width: `${(r.percent / max) * 100}%`,
                  backgroundColor: partyColorVar(r.shortcut),
                }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-mono tabular-nums">
              {r.percent.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
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
